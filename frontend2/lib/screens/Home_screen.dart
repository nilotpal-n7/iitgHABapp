// import 'package:flutter/material.dart';
// import 'package:frontend1/apis/users/user.dart';
// import 'package:frontend1/widgets/mess_change_widget.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// class HomeScreen extends StatefulWidget {
//   const HomeScreen({super.key});

//   @override
//   State<HomeScreen> createState() => _MessChangeHomeState();
// }

// class _MessChangeHomeState extends State<HomeScreen> {
//   String name = '';
//   String email = '';
//   String roll = '';
//   String hostel = '';
//   String currMess = '';

//   @override
//   void initState() {
//     // TODO: implement initState
//     super.initState();
//     fetchUserData();
//     getAllocatedHostel();
//   }


//   void getAllocatedHostel() async {
//     final prefs = await SharedPreferences.getInstance();
//     final allocatehostel = prefs.getString('currMess');
//     setState(() {
//       currMess = allocatehostel ?? ' ';
//     });
//   }

//   Future<void> fetchUserData() async {
//     final userDetails = await fetchUserDetails();
//     print("USer details is");
//     print(userDetails);
//     if (userDetails != null) {
//       setState(() {
//         name = userDetails['name'] ?? '';
//         email = userDetails['email'] ?? '';
//         roll = userDetails['roll'] ?? '';
//       });
//     } else {
//       print("Failed to load user details.");
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         backgroundColor: Colors.deepOrange,
//         title: Text("Mess"),
//       ),
//       body: SingleChildScrollView(
//         child: Column(
//           crossAxisAlignment: CrossAxisAlignment.start,
//           children: [
//             Container(
//               width: double.infinity,
//               child: Card(
//                 elevation: 5,
//                 shape: RoundedRectangleBorder(
//                   borderRadius: BorderRadius.circular(15),
//                 ),
//                 child: Padding(
//                   padding: const EdgeInsets.all(16.0),
//                   child: Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     children: [
//                       _buildProfileItem("Name", name),
//                       SizedBox(height: 16),
//                       _buildProfileItem("Roll Number", roll),
//                       SizedBox(height: 16),
//                       _buildProfileItem("Email", email),
//                       SizedBox(height: 16),
//                       _buildProfileItem("Hostel", hostel),
//                       SizedBox(height: 16),
//                       _buildProfileItem("Allocated Mess", currMess),
//                       const SizedBox(height: 20,),
//                       ChangeMessWidget(),
//                     ],
//                   ),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }

//   // Helper function to build each label and value pair
//   Widget _buildProfileItem(String label, String value) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text(label,
//             style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
//         SizedBox(height: 4),
//         Text(value.isNotEmpty ? value : 'Not provided',
//             style: TextStyle(fontSize: 16)),
//       ],
//     );
//   }
// }
