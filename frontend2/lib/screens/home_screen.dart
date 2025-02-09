import 'package:flutter/material.dart';
import 'package:frontend1/apis/users/user.dart';
import 'package:frontend1/screens/mess_card.dart';
import 'package:frontend1/widgets/common/name_trimmer.dart';
import 'package:frontend1/screens/mess_change_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend1/screens/profile_screen.dart';
import 'package:marquee/marquee.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String name = '';
  bool shouldScroll = false;

  @override
  void initState() {
    super.initState();
    fetchUserData();
  }

  Future<void> fetchUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final name1 = prefs.getString('name');
    print("User details are:");
    print(name1);
    if (name1 != null) {
      setState(() {
        name = (capitalizeWords(name1) ?? '').split(' ').first;
      });
      checkIfTextFits();
    } else {
      print("Failed to load user details.");
    }
  }

  void checkIfTextFits() {
    final textPainter = TextPainter(
      text: TextSpan(
        text: "Hello, ${name.isNotEmpty ? name : 'User'} 🖐",
        style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold),
      ),
      maxLines: 1,
      textDirection: TextDirection.ltr,
    )..layout();

    final availableWidth = MediaQuery.of(context).size.width - 32; // Padding

    setState(() {
      shouldScroll = textPainter.size.width > availableWidth;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: const Padding(
          padding:  EdgeInsets.only(left: 15.0),
          child:  Image(image: AssetImage("assets/images/Handlogo.png")),
        ),
        title: const Text(
          "HAB\nIIT Guwahati",
          style: TextStyle(
            fontFamily: 'OpenSans-Bold',
            color: Colors.black,
            fontSize: 16,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => ProfileScreen()),
                );
              },
              icon: const Icon(Icons.person_outlined, color: Colors.black),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            SizedBox(
              height: 80,
              child: shouldScroll
                  ? Marquee(
                text: "Hello, ${name.isNotEmpty ? name : 'User'} 🖐",
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 40,
                ),
                scrollAxis: Axis.horizontal,
                blankSpace: 20.0,
                velocity: 30.0,
                pauseAfterRound: const Duration(seconds: 2),
                startPadding: 10.0,
                accelerationDuration: const Duration(seconds: 1),
                accelerationCurve: Curves.linear,
                decelerationDuration: const Duration(milliseconds: 500),
                decelerationCurve: Curves.easeOut,
              )
                  : RichText(
                text: TextSpan(
                  children: [
                    const TextSpan(
                      text: "Hello, ",
                      style: TextStyle(
                        fontFamily: 'OpenSans_regular',
                        fontSize: 40,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                    TextSpan(
                      text: name.isNotEmpty ? name : 'User',
                      style: const TextStyle(
                        fontFamily: 'OpenSans_bold',
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const TextSpan(
                      text: " 🖐",
                      style: TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Flexible(
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => MessChangeScreen(),
                        ),
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
                 Flexible(
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => messcard(),
                        ),
                      );
                    },
                  child: const FeatureCard(
                    title: "Mess Card",
                    color: Color.fromRGBO(192, 200, 245, 1),
                    circleColor: Color.fromRGBO(168, 177, 230, 1),
                    icon: Icons.arrow_outward,
                    iconAlignment: Alignment.bottomRight,
                  ),
                ),
                 ),
              ],
            ),
            const SizedBox(height: 16),
            const Row(
              children:  [
                Flexible(
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
                    fontFamily: 'OpenSans_regular',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            else
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'OpenSans_regular',
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
