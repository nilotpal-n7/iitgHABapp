import 'package:flutter/material.dart';
import 'package:frontend1/screens/mess_change_screen.dart';
import 'package:frontend1/screens/profile_screen.dart';

class homeScreen extends StatelessWidget {
  const homeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: Padding(
          padding: const EdgeInsets.only(left: 15.0),
          child: Image(image: AssetImage("assets/images/Handlogo.png")),
        ),
        title: const Text(
          "HAB\nIIT Guwahati",
          style: TextStyle(color: Colors.black, fontSize: 16),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ProfileScreen()),
              );
            },
            icon: const Icon(Icons.person_outlined, color: Colors.black),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.search_outlined, color: Colors.black),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            const Text(
              "Hello, User 🖐️",
              style: TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Flexible(
                  child: GestureDetector(
                    onTap: () {
                      // Navigate to the next page
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => MessChangeScreen()),
                      );
                    },
                    child: const FeatureCard(
                      title: "Change Mess",
                      color: Color.fromRGBO(192, 200, 245, 1),
                      circleColor: Color.fromRGBO(168, 177, 230, 1),
                      icon: Icons.arrow_outward,
                      iconAlignment: Alignment.bottomRight,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const Flexible(
                  child: FeatureCard(
                    title: "More features\ncoming soon",
                    color: Color.fromRGBO(206, 192, 129, 1),
                    isCentered: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class FeatureCard extends StatelessWidget {
  final String title;
  final Color color;
  final Color? circleColor;
  final IconData? icon;
  final AlignmentGeometry iconAlignment;
  final bool isCentered;

  const FeatureCard({
    super.key,
    required this.title,
    required this.color,
    this.circleColor,
    this.icon,
    this.iconAlignment = Alignment.bottomCenter,
    this.isCentered = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 175,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(32),
        ),
        child: Stack(
          children: [
            if (isCentered)
              Center(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            else
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            if (icon != null)
              Align(
                alignment: iconAlignment,
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: circleColor ?? Colors.white,
                  child: Icon(icon, color: Colors.black, size: 16),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
