import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:frontend2/apis/authentication/login.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:frontend2/widgets/common/custom_linear_progress.dart';
import 'package:frontend2/widgets/common/hostel_name.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String name = '';
  String email = '';
  String roll = '';
  String hostel = '';
  String roomNo = '';
  String phone = '';
  String currMess = '';
  bool _isloading = true;
  bool canChangeProfilePic = false;
  bool _canChangePhoto = true; // default to true until fetched
  // Controllers
  final TextEditingController _roomController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  bool _uploading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _initializeData();
    _fetchProfileSettings();
  }

  @override
  void dispose() {
    _roomController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _initializeData() async {
    setState(() {
      _isloading = true;
    });
    await getAllocatedHostel();
    setState(() {
      _isloading = false;
    });
  }

  Future<void> getAllocatedHostel() async {
    final prefs = await SharedPreferences.getInstance();
    final hostel1 = prefs.getString('hostel');
    final email1 = prefs.getString('email');
    final name1 = prefs.getString('name');
    final mess1 = prefs.getString('currMess');
    final roomSaved = prefs.getString('roomNumber');
    final phoneSaved = prefs.getString('phoneNumber');

    setState(() {
      hostel = hostel1 ?? 'Siang';
      name = name1 ?? 'Aprutul Vasu';
      email = email1 ?? 'v.katiyar@iitg.ac.in';
      currMess = mess1 ?? 'Lohit';
      roomNo = roomSaved ?? '';
      phone = phoneSaved ?? '';
      _roomController.text = roomSaved ?? '';
      _phoneController.text = phoneSaved ?? '';
    });
  }

  Future<void> _fetchProfileSettings() async {
    try {
      final token = await getAccessToken();
      if (token == 'error') return;
      final dio = Dio();
      final res = await dio.get(
        '${baseUrl}/profile/settings',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      if (res.statusCode == 200) {
        final data = res.data as Map;
        setState(() {
          _canChangePhoto = (data['allowProfilePhotoChange'] == true);
        });
      }
    } catch (_) {}
  }

  // Pick and upload profile image
  Future<void> _pickAndSetProfileImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? pfp = await picker.pickImage(source: ImageSource.gallery);
    if (pfp == null) return;

    final finalPath = '${(await getTemporaryDirectory()).path}/${pfp.name}';
    await FlutterImageCompress.compressAndGetFile(
      pfp.path,
      finalPath,
      minWidth: 256,
      minHeight: 256,
      quality: 85,
    );

    final imageB64 = base64Encode(File(finalPath).readAsBytesSync());
    ProfilePictureProvider.profilePictureString.value = imageB64;
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    await _uploadProfileImage(File(finalPath), pfp.name);
    await prefs.setString('profilePicture', imageB64);
  }

  Future<void> _uploadProfileImage(File file, String filename) async {
    if (_uploading) return;
    setState(() => _uploading = true);
    try {
      final token = await getAccessToken();
      if (token == 'error') {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Not authenticated. Please login again.')),
        );
        return;
      }

      final dio = Dio();
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: filename,
        ),
      });

      final res = await dio.post(
        ProfilePicture.changeUserProfilePicture,
        data: formData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (res.statusCode == 200) {
        final data = res.data as Map;
        final url = data['url'] as String?;
        final prefs = await SharedPreferences.getInstance();
        if (url != null && url.isNotEmpty) {
          await prefs.setString('profilePictureUrl', url);
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture updated')),
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed (${res.statusCode})')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload error: $e')),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _saveEditableFields() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final newRoom = _roomController.text.trim();
      final newPhone = _phoneController.text.trim();
      await prefs.setString('roomNumber', newRoom);
      await prefs.setString('phoneNumber', newPhone);
      setState(() {
        roomNo = newRoom;
        phone = newPhone;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
      Navigator.of(context).maybePop();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _openEditProfileSheet() {
    // Seed latest values
    _roomController.text = roomNo;
    _phoneController.text = phone;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Text('Edit profile',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _roomController,
                decoration: InputDecoration(
                  labelText: 'Room Number',
                  prefixIcon: const Icon(Icons.meeting_room_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _saveEditableFields,
                  style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6149CD)),
                  child: Text(_saving ? 'Saving...' : 'Save',
                      style: const TextStyle(color: Colors.white)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleChangePhotoTap() {
    if (_canChangePhoto) {
      _pickAndSetProfileImage();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Changing profile photo is not allowed now. Please contact the HAB Admin.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.grey[50],
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Profile",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        centerTitle: false,
      ),
      body: _isloading
          ? const Center(
              child: CustomLinearProgress(
                text: 'Loading your details, please wait...',
              ),
            )
          : SingleChildScrollView(
              child: Container(
                color: Colors.white,
                margin: const EdgeInsets.only(top: 8),
                child: Column(
                  children: [
                    // Main content with padding
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 32),
                      child: Column(
                        children: [
                          // Profile Image
                          Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            child: ValueListenableBuilder(
                              valueListenable:
                                  ProfilePictureProvider.profilePictureString,
                              builder: (context, value, child) => CircleAvatar(
                                radius: 68,
                                backgroundColor: Colors.blue[100],
                                backgroundImage: (value).isNotEmpty
                                    ? MemoryImage(base64Decode(value))
                                    : const NetworkImage(
                                            "https://api.dicebear.com/7.x/initials/svg?seed=User")
                                        as ImageProvider,
                              ),
                            ),
                          ),

                          OutlinedButton(
                            onPressed:
                                _uploading ? null : _handleChangePhotoTap,
                            child: Text(_uploading
                                ? 'Uploading...'
                                : 'Change Profile Picture'),
                          ),

                          const SizedBox(height: 16),
                          // Name (read-only)
                          _buildField(
                            icon: Icons.person_outline,
                            label: "Name",
                            value: name,
                          ),

                          const Divider(height: 24, color: Color(0xFFE2E2E2)),

                          // Current Mess (read-only)
                          _buildField(
                            icon: Icons.restaurant_menu_outlined,
                            label: "Current Mess",
                            value: calculateHostel(currMess),
                          ),

                          const Divider(height: 24, color: Color(0xFFE2E2E2)),

                          // Hostel and Room No. (both read-only here)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Hostel (read-only)
                              Expanded(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.home_outlined,
                                      color: Colors.grey[600],
                                      size: 28,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            "Hostel",
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[600],
                                              fontWeight: FontWeight.w400,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            calculateHostel(hostel),
                                            style: const TextStyle(
                                              fontSize: 15,
                                              color: Colors.black,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Room No. (read-only)
                              Expanded(
                                child: Container(
                                  decoration: const BoxDecoration(
                                    border: Border(
                                      left: BorderSide(
                                          width: 1, color: Color(0xFFE2E2E2)),
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              "Room No.",
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600],
                                                fontWeight: FontWeight.w400,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              roomNo.isEmpty ? '-' : roomNo,
                                              style: const TextStyle(
                                                fontSize: 15,
                                                color: Colors.black,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const Divider(height: 24, color: Color(0xFFE2E2E2)),

                          // Phone (read-only)
                          _buildField(
                            icon: Icons.phone_outlined,
                            label: "Phone",
                            value: phone.isEmpty ? '-' : phone,
                          ),

                          const Divider(height: 24, color: Color(0xFFE2E2E2)),

                          // Outlook ID (read-only)
                          _buildField(
                            icon: Icons.email_outlined,
                            label: "Outlook Id",
                            value: email,
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),

                    const SizedBox(height: 80), // space for bottom buttons
                  ],
                ),
              ),
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _openEditProfileSheet,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side:
                        const BorderSide(color: Color(0xFF6149CD), width: 1.2),
                  ),
                  child: const Text('Edit Profile'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _showSignOutDialog(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: Colors.red[400]!, width: 1.2),
                  ),
                  child: Text(
                    'Logout',
                    style: TextStyle(color: Colors.red[400]),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, color: Colors.grey[600], size: 28),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                    fontSize: 15,
                    color: Colors.black,
                    fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text('Logout',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          content: const Text('Are you sure you want to logout?',
              style: TextStyle(fontSize: 14, color: Colors.black87)),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14)),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                logoutHandler(context);
              },
              child: Text('Logout',
                  style: TextStyle(
                      color: Colors.red[400],
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
            ),
          ],
        );
      },
    );
  }
}
