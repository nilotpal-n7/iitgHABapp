import 'package:flutter/material.dart';
import 'package:frontend1/apis/users/user.dart';
import 'package:frontend1/widgets/common/hostel_details.dart';
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
  String applyMess = '';
  String? selectedHostel;
  bool isSubmitted = false;
  bool correctDay = false;
  bool gotMess = false;

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
     // Reset state if it's a new week (Monday)
    _checkAllowedDays();
  }




  late String Message = 'You can apply for any Hostel';


  // Check if the button should be enabled
  Future<void> _checkAllowedDays() async {
    final now = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    final clicked = prefs.getBool('buttonpressed') ?? false;
    final gotMess1 = prefs.getBool('gotMess') ?? false;
    print("you pressed : $clicked");
    // Update the state based on the condition

    setState(() {
      correctDay = (now.weekday >= DateTime.monday &&
          now.weekday <= DateTime.wednesday );
      isSubmitted = clicked ;
      gotMess = gotMess1;
    });
    print("isSubmitted is: $isSubmitted");
  }

  void getAllocatedHostel() async {
    final prefs = await SharedPreferences.getInstance();
    final currentMess = prefs.getString('currMess');
    final appliedMess = prefs.getString('appliedMess');
    setState(() {
      currMess = currentMess ?? 'Not Assigned';
      applyMess = appliedMess ?? '';
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

          Navigator.pop(context);
        },
      ),
    );
  }

  // Refresh function for pull-to-refresh
  Future<void> _onRefresh() async {
    await fetchUserData(); // Refresh data when pulled
    setState(() {
      // Optionally, update state here if needed after refresh
    });
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
          style: TextStyle(
              fontFamily: 'OpenSans_bold',
              fontWeight: FontWeight.w400,
              fontSize: 24),
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
              if (!isSubmitted && correctDay) ...[
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
                  child: const TextField(
                    maxLines: 5,
                    decoration: const InputDecoration(
                      hintText: "Write your reason here",
                      contentPadding: EdgeInsets.all(16.0),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ] else if(!correctDay && isSubmitted && !gotMess) ...[
                Container(
                  child: const Text(
                    "Sorry! Apply again Next Week",
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                      color: Colors.green,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ] else if(!correctDay && isSubmitted && gotMess) ...[
                Container(
                  child:  Text(
                    "Your Alloted Mess for Next Week is $applyMess",
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                      color: Colors.green,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ] else if(correctDay && isSubmitted ) ...[
                Container(
                  child:  Text(
                    "You have Applied for the mess $selectedHostel",
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                      color: Colors.green,
                    ),
                  ),
                ),
                const SizedBox(height: 24,),
              ] else ...[
                Container(
                  child: const Text(
                    "You can Apply Next week",
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                      color: Colors.green,
                    ),
                  ),
                ),
              ],
              if (!isSubmitted)
                Center(
                  child: ElevatedButton(
                    onPressed: selectedHostel == null
                        ? null
                        : () async {
                      // Save the current date as the last press date
                      fetchHostelData(selectedHostel!, roll);
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
