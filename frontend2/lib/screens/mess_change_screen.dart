import 'package:flutter/material.dart';
import 'package:frontend1/apis/users/user.dart';
import 'package:frontend1/widgets/confirmation_dialog.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animated_custom_dropdown/custom_dropdown.dart';

class MessChangeScreen extends StatefulWidget {
  const MessChangeScreen({super.key});

  @override
  State<MessChangeScreen> createState() => _MessChangeScreenState();
}

class _MessChangeScreenState extends State<MessChangeScreen> {
  String name = '';
  String email = '';
  String roll = '';
  String currMess = '';
  String? selectedHostel;
  bool isSubmitted = false;

  final List<String> hostels = [
    'Lohit',
    'Kapili',
    'Umiam',
    'Gaurang',
    'Manas',
    'Brahmaputra',
    'Dihing',
    'MSH',
    'Dhansiri',
    'Kameng',
    'Subansiri',
    'Siang',
    'Disang',
  ];

  final SingleSelectController<String> hostelController =
  SingleSelectController<String>(null);

  @override
  void initState() {
    super.initState();
    fetchUserData();
    getAllocatedHostel();
  }

  void getAllocatedHostel() async {
    final prefs = await SharedPreferences.getInstance();
    final allocateHostel = prefs.getString('currMess');
    setState(() {
      currMess = allocateHostel ?? 'Not Assigned';
    });
  }

  Future<void> fetchUserData() async {
    final userDetails = await fetchUserDetails();
    if (userDetails != null) {
      setState(() {
        name = userDetails['name'] ?? '';
        email = userDetails['email'] ?? '';
        roll = userDetails['roll'] ?? '';
      });
    } else {
      print("Failed to load user details.");
    }
  }

  void _showConfirmationDialog() {
    showDialog(
      context: context,
      builder: (context) => ConfirmationDialog(
        onConfirm: () {
          setState(() {
            isSubmitted = true;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromRGBO(237, 237, 237, 1),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: const Text(
          "Change Mess",
          style: TextStyle(fontWeight: FontWeight.w400, fontSize: 24),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Current Mess",
                style: TextStyle(fontSize: 16, color: Color.fromRGBO(0, 0, 0, 1)),
              ),
              Text(
                currMess,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Name",
                style: TextStyle(fontSize: 16, color: Color.fromRGBO(0, 0, 0, 1)),
              ),
              Text(
                name.isNotEmpty ? name : 'Not provided',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 24),
              const Text(
                "Roll Number",
                style: TextStyle(fontSize: 16, color: Color.fromRGBO(0, 0, 0, 1)),
              ),
              Text(
                roll.isNotEmpty ? roll : 'Not provided',
                style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 24),
              if (!isSubmitted) ...[
                const SizedBox(height: 8),
                const Text(
                  "Change mess to:",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
                ),
                const SizedBox(height: 8),
                CustomDropdown<String>(
                  controller: hostelController,
                  items: hostels,
                  onChanged: (value) {
                    setState(() {
                      selectedHostel = value;
                    });
                  },
                  hintText: "Change Mess to: ${selectedHostel ?? ''}",
                ),
                const SizedBox(height: 24),
                const Text(
                  "Reason for changing",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w400),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    maxLines: 5,
                    decoration: const InputDecoration(
                      hintText: "Write your reason here",
                      contentPadding: EdgeInsets.all(16.0),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ] else ...[
                Text(
                  "Applied for mess change in: $selectedHostel",
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w400,
                    color: Colors.green,
                  ),
                ),
              ],
              if (!isSubmitted)
                Center(
                  child: ElevatedButton(
                    onPressed: selectedHostel == null
                        ? null
                        : () {
                      setState(() {
                        isSubmitted = true;
                      });
                      _showConfirmationDialog();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selectedHostel == null
                          ? Colors.grey
                          : const Color.fromRGBO(57, 77, 198, 1),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      "Confirm Your Choice",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
