import 'package:flutter/material.dart';
import 'package:frontend1/apis/users/user.dart';
import 'package:frontend1/widgets/common/hostel_details.dart';
import 'package:frontend1/widgets/confirmation_dialog.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'profile_screen.dart';

class MessChangeScreen extends StatefulWidget {
  const MessChangeScreen({super.key});

  @override
  State<MessChangeScreen> createState() => _MessChangeScreenState();
}

class _MessChangeScreenState extends State<MessChangeScreen> {
  String name = '';
  String email = '';
  String roll = '';
  String hostel = '';
  String currMess = '';
  String? selectedHostel;
  bool isSubmitted = false; // Track if submission is done
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

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    fetchUserData();
    getAllocatedHostel();
    _resetButtonStateIfNewWeek(); // Reset state if it's a new week (Monday)
    _checkAllowedDays();
    displaydata();
  }
  late String Message = 'You can apply for any Hostel';
  void displaydata() async {
    final prefs = await SharedPreferences.getInstance();
    final pressedorNot = prefs.getBool('clicked');
    final currHostel = prefs.getString('Hostel');
    final gotHostel = prefs.getBool('gotMess');
    final now = DateTime.now();

    if (now.weekday == DateTime.monday || now.weekday == DateTime.tuesday || now.weekday == DateTime.wednesday)
    {
      if(pressedorNot == true)
      {
        setState(() {
          Message = 'You have applied for this $currHostel';
        });
      }
      else{
        setState(() {
          Message = 'You can apply for any Hostel';
        });
      }

    }
    else{
      if(pressedorNot == true)
      {
        if(gotHostel == true) {
          setState(() {
            Message = 'You have gotten hostel $currHostel';
          });
        }
        else{
          setState(() {
            Message = "We are sorry you havent got your mess changed";
          });
        }
      }
      else{
        setState(() {
          Message = 'You can Apply next week';
        });
      }
    }

  }

  // Reset button state if it's a new week (Monday)
  Future<void> _resetButtonStateIfNewWeek() async {
    final now = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    final lastResetDateString = prefs.getString('lastResetDate');

    if (lastResetDateString != null) {
      final lastResetDate = DateTime.parse(lastResetDateString);

      // Check if today is Monday and it's a new week compared to the last reset date
      if ((now.weekday == DateTime.monday || now.weekday == DateTime.tuesday || now.weekday == DateTime.wednesday) && now.isAfter(_getStartOfNextWeek(lastResetDate))) {
        setState(() {
          isSubmitted = false;
        });
      }
    } else  {
      setState(() {
        isSubmitted = false;
      });
      // Initialize the reset date if it doesn't exist
    }
  }

  // Get the start of the next week (Monday) after a given date
  DateTime _getStartOfNextWeek(DateTime date) {
    final daysToNextMonday = (DateTime.monday - date.weekday + 7) % 7;
    return date.add(Duration(days: daysToNextMonday));
  }

  // Check if the button should be enabled
  Future<void> _checkAllowedDays() async {
    final now = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    final clicked = prefs.getBool('clicked') ?? false;

    // Update the state based on the condition
    setState(() {
      isSubmitted = now.weekday >= DateTime.monday &&
          now.weekday <= DateTime.wednesday &&
          !clicked;
    });
  }

  void getAllocatedHostel() async {
    final prefs = await SharedPreferences.getInstance();
    final allocatehostel = prefs.getString('Hostel');
    setState(() {
      currMess = allocatehostel ?? ' ';
    });
  }

  Future<void> fetchUserData() async {
    final userDetails = await fetchUserDetails();
    print("USer details is");
    print(userDetails);
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
                style: TextStyle(
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              const Text(
                "Brahmaputra",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Color.fromRGBO(57, 77, 198, 1),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Name",
                style: TextStyle(
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                name.isNotEmpty ? name : 'Not provided',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 24),
              const Text(
                "Roll Number",
                style: TextStyle(
                  fontSize: 16,
                  color: Color.fromRGBO(0, 0, 0, 1),
                ),
              ),
              Text(
                roll.isNotEmpty ? name : 'Not provided',
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w400),
              ),
              const SizedBox(height: 24),
              if (!isSubmitted) ...[
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      const Text(
                        "Change mess to:",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: selectedHostel,
                          onChanged: (value) {
                            setState(() {
                              selectedHostel = value;
                            });
                          },
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                          ),
                          isExpanded: true,
                          items: hostels
                              .map(
                                (hostel) => DropdownMenuItem<String>(
                              value: hostel,
                              child: Text(hostel),
                            ),
                          )
                              .toList(),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  "Reason for changing",
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: "Write your reason here",
                      contentPadding: const EdgeInsets.all(16.0),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              ] else ...[
                Container(
                  child: Text(
                    "Applied for mess change in: $selectedHostel",
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
                      final prefs = await SharedPreferences.getInstance();
                      setState(() {
                        isSubmitted = true;
                      });
                      await prefs.setString('Hostel', selectedHostel!);
                      await prefs.setBool('clicked', true);
                      // Save the current date as the last press date
                      await prefs.setString('lastResetDate', DateTime.now().toIso8601String());
                      fetchHostelData(selectedHostel!, roll);
                      displaydata();
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
