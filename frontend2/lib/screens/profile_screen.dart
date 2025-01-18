import 'package:flutter/material.dart';
import 'package:frontend1/apis/authentication/login.dart';
import 'package:frontend1/apis/users/user.dart';
import 'package:frontend1/widgets/common/hostel_details.dart';
import 'package:frontend1/widgets/common/hostel_name.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  String currMess = '';

  @override
  void initState() {
    super.initState();
    fetchUserData();
    getAllocatedHostel();
  }

  void getAllocatedHostel() async {
    final prefs = await SharedPreferences.getInstance();
    final allocatehostel = prefs.getString('currMess');
    setState(() {
      currMess = allocatehostel ?? ' ';
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
          "Profile",
          style: TextStyle(
            fontFamily: 'OpenSans_bold',
            fontWeight: FontWeight.w400,
            fontSize: 24,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Name:",
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                name.isNotEmpty ? name : 'Not provided',
                style: const TextStyle(
                  fontFamily: 'OpenSans_bold',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Roll number:",
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                roll.isNotEmpty ? roll : 'Not provided',
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Email:",
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                email.isNotEmpty ? email : 'Not provided',
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Hostel:",
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                hostel.isNotEmpty ? hostel : 'Not provided',
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Allocated Mess:",
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                calculateHostel(currMess),
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 32),
              Center(
                child: ElevatedButton(
                  onPressed: () => logoutHandler(context),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                    backgroundColor: const Color.fromRGBO(57, 77, 198, 1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    "Sign Out",
                    style: TextStyle(
                      fontSize: 16,
                      fontFamily: 'OpenSans_bold',
                      color: Colors.white,
                    ),
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
