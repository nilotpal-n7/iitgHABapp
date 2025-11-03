import 'package:flutter/material.dart';

class ComplaintsScreen extends StatelessWidget {
  const ComplaintsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: Colors.white,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Mess Complaints",
                  style: TextStyle(
                    fontFamily: 'OpenSans_regular',
                    fontSize: 32,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2E2F31),
                  ),
                ),
                const SizedBox(height: 32),
                // const Text("Coming Soon...", style: TextStyle(color: Colors.deepPurple)),
                // const SizedBox(height: 11),
                // const LinearProgressIndicator(value: 0.5, color: Colors.deepPurple),
                // const SizedBox(height: 16),
                Expanded(
                  child: ListView(
                    children: const [
                      Text(
                        "Coming Soon...",
                        style: TextStyle(
                            fontFamily: 'OpenSans-Regular',
                            fontWeight: FontWeight.w500,
                            fontSize: 20),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
