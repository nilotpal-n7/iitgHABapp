import 'package:flutter/material.dart';
import 'package:frontend1/screen1/qr_scanner.dart';
import 'package:marquee/marquee.dart';

import '../screens/Home_screen.dart';

//This home Screen is for mess officials

class homescreen1 extends StatelessWidget {
  const homescreen1({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0), // Add padding for spacing
            child: Align(
              alignment: Alignment.topLeft,
              child: GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const QrScanner(),
                    ),
                  );
                },
                child: const SizedBox(
                  width: 200, // Set square width
                  height: 150, // Set square height
                  child: FeatureCard(
                    title: "Gala Dinner",
                    color: Color.fromRGBO(192, 200, 245, 1),
                    circleColor: Color.fromRGBO(168, 177, 230, 1),
                    icon: Icons.arrow_outward,
                    iconAlignment: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
