import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/apis/authentication/login.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/screens/profile_picture_screen.dart';
import 'package:frontend2/widgets/common/custom_linear_progress.dart';
import 'package:frontend2/widgets/common/hostel_name.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

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

  @override
  void initState() {
    super.initState();
    _initializeData();
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

    setState(() {
      hostel = hostel1 ?? 'Siang';
      name = name1 ?? 'Aprutul Vasu';
      email = email1 ?? 'v.katiyar@iitg.ac.in';
      currMess = mess1 ?? 'Lohit';
      roomNo = '69'; // You can fetch this from SharedPreferences if available
      phone = '6969696969'; // You can fetch this from SharedPreferences if available
    });
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                child: Column(
                  children: [
                    // Profile Image
                    Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      child: ValueListenableBuilder(
                        valueListenable: ProfilePictureProvider.profilePictureString,
                        builder: (context, value, child) => CircleAvatar(
                          radius: 68,
                          backgroundColor: Colors.blue[100],
                          backgroundImage: MemoryImage(base64Decode(value))
                        ),
                      ),
                    ),

                    InkWell(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        decoration: BoxDecoration(border: Border.all(color: const Color(0xFFC5C5D1)), borderRadius: BorderRadius.circular(6), color: Colors.grey[200]),
                        child: const Text("Change Profile Picture"),
                      ),
                      onTap: () async {
                        print("ToDo: Pick Image");
                      },
                    ),

                    // Name
                    _buildField(
                      icon: Icons.person_outline,
                      label: "Name",
                      value: name,
                    ),

                    const Divider(height: 24, color: Color(0xFFE2E2E2),),

                    // const SizedBox(height: 20),

                    // Current Mess
                    _buildField(
                      icon: Icons.restaurant_menu_outlined,
                      label: "Current Mess",
                      value: calculateHostel(currMess),
                    ),

                    const Divider(height: 24, color: Color(0xFFE2E2E2),),

                    // const SizedBox(height: 20),

                    // Hostel and Room No. in same row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hostel
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
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
                        // Room No.
                        Expanded(
                          child: Container(
                            decoration: const BoxDecoration(
                              border: Border(left: BorderSide(width: 1, color: Color(0xFFE2E2E2)))
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
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
                                        roomNo,
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

                    const Divider(height: 24, color: Color(0xFFE2E2E2),),

                    // const SizedBox(height: 20),

                    // Phone
                    _buildField(
                      icon: Icons.phone_outlined,
                      label: "Phone",
                      value: phone,
                    ),

                    const Divider(height: 24, color: Color(0xFFE2E2E2),),


                    // const SizedBox(height: 20),

                    // Outlook ID
                    _buildField(
                      icon: Icons.email_outlined,
                      label: "Outlook Id",
                      value: email,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),

              // Logout button at the bottom
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: OutlinedButton(
                  onPressed: () => _showSignOutDialog(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(
                      color: Colors.red[400]!,
                      width: 1.5,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.logout_outlined,
                        color: Colors.red[400],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "Logout",
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.red[400],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
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
        Icon(
          icon,
          color: Colors.grey[600],
          size: 28,
        ),
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
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
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
    );
  }

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: const Text(
            "Logout",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          content: const Text(
            "Are you sure you want to logout?",
            style: TextStyle(
              fontSize: 14,
              color: Colors.black87,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(
                "Cancel",
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                logoutHandler(context);
              },
              child: Text(
                "Logout",
                style: TextStyle(
                  color: Colors.red[400],
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}