import 'package:flutter/material.dart';
import 'package:frontend1/screens/profile_screen.dart';
import 'mess_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend1/widgets/common/name_trimmer.dart';
import 'package:flutter_svg/flutter_svg.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String name = '';
  int expandedSection = 1; // 1: complaints, 2: mess, 3: alerts
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    fetchUserData();
  }

  Future<void> fetchUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final name1 = prefs.getString('name');
    if (name1 != null) {
      setState(() {
        name = (capitalizeWords(name1) ?? '').split(' ').first;
      });
    }
  }


  final List<Widget> _pages = [
    MessScreen(),
  ];

  void _onNavTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget buildComplaintsCard() {
    const usernameBlue = Color(0xFF3754DB);

    Widget sectionHeader(String title, int section, {Widget? trailing}) {
      return InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          setState(() {
            expandedSection = expandedSection == section ? 0 : section;
          });
        },
        child: Row(
          children: [
            Text(
              title,
              style: TextStyle(
                color: section == 1 ? usernameBlue : Colors.black87,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: 6), trailing],
            const Spacer(),
            Icon(
              expandedSection == section
                  ? Icons.keyboard_arrow_up_rounded
                  : Icons.keyboard_arrow_down_rounded,
              color: Colors.black38,
            ),
          ],
        ),
      );
    }

    Widget sectionBody(int section) {
      if (expandedSection != section) return const SizedBox.shrink();
      // Only show "Coming soon" for all sections
      return const Padding(
        padding:  EdgeInsets.symmetric(vertical: 18.0),
        child: Center(
          child: Text(
            "Coming soon",
            style: TextStyle(
              color: Colors.black54,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      );
    }

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0.5,
      child: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            sectionHeader("Complaints", 1),
            sectionBody(1),
            if (expandedSection != 1) const Divider(),
            sectionHeader("Mess", 2),
            sectionBody(2),
            if (expandedSection != 2) const Divider(),
            sectionHeader(
              "Alerts",
              3,
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Color(0xFFE9EAFB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  "2",
                  style: TextStyle(
                    color: usernameBlue,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            sectionBody(3),
          ],
        ),
      ),
    );
  }

  Widget buildQuickActions() {
    const usernameBlue = Color(0xFF3754DB);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18.0),
      child: Row(
        children: [
          // New Complaint Button
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {},
              child: Container(
                height: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F6F6),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'assets/icon/complaint.svg',
                      width: 32,
                      height: 32,
                      color: const Color(0xFF3754DB),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "New Complaint",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 18),
          // Mess QR Button
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {},
              child: Container(
                height: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F6F6),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'assets/icon/qrcode.svg',
                      width: 32,
                      height: 32,
                      color: const Color(0xFF3754DB),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Mess QR",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildMessTodayCard() {
    const green = Color(0xFF1DB954);

    Widget heart() => const Padding(
      padding: EdgeInsets.only(left: 6.0),
      child: Icon(Icons.favorite, color: Colors.red, size: 16),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Row: "In Mess Today" and "Go to Mess"
        const Row(
          children:  [
            Text(
              "In Mess Today",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Spacer(),
            Text(
              "Go to Mess",
              style: TextStyle(
                color: Color(0xFF3754DB),
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0.5,
          child: Padding(
            padding: const EdgeInsets.all(18.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: "Breakfast", "In 2 hrs", time
                const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     Text(
                      "Breakfast ",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      "In 2 hrs",
                      style: TextStyle(
                        color: green,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                     Spacer(),
                     Text(
                      "7:00 AM - 9:45 PM",
                      style: TextStyle(
                        color: Colors.black54,
                        fontWeight: FontWeight.normal,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // DISH Section
                const Text(
                  "DISH",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text("Choley", style: TextStyle(fontSize: 15)),
                Row(
                  children: [
                    const Text("Aloo Pumpkin Chickpeas", style: TextStyle(fontSize: 15)),
                    heart(),
                  ],
                ),
                Row(
                  children: [
                    const Text("Dal Triveni", style: TextStyle(fontSize: 15)),
                    heart(),
                  ],
                ),
                const SizedBox(height: 10),
                // Horizontal Divider
                const Divider(thickness: 1, height: 24),
                // BREADS & RICE and OTHERS
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // BREADS & RICE
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "BREADS & RICE",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Text("Bhature", style: TextStyle(fontSize: 15)),
                                heart(),
                              ],
                            ),
                            const Text("Peas Pulao", style: TextStyle(fontSize: 15)),
                          ],
                        ),
                      ),
                      // Vertical Divider
                      VerticalDivider(
                        thickness: 1,
                        width: 32,
                        color: Colors.grey.shade300,
                      ),
                      // OTHERS
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "OTHERS",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text("Imli Chutney", style: TextStyle(fontSize: 15)),
                            Row(
                              children: [
                                const Text("Sweet Lassi", style: TextStyle(fontSize: 15)),
                                heart(),
                              ],
                            ),
                            const Text("Fruit Custard", style: TextStyle(fontSize: 15)),
                          ],
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
    );
  }


  @override
  Widget build(BuildContext context) {
    const usernameBlue = Color(0xFF3754DB);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: Padding(
          padding: const EdgeInsets.only(left: 15.0),
          child: InkWell(
            //borderRadius: BorderRadius.circular(30),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ProfileScreen()),
              );
            },
            child: const CircleAvatar(
              backgroundColor: Color(0xFFEFEFEF),
              radius: 18,
            ),
          ),
        ),
        title: const SizedBox.shrink(),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16, top: 10),
            child: Image.asset(
              "assets/images/Handlogo.png",
              width: 36,
              height: 36,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  children: [
                    const TextSpan(
                      text: "Good morning, ",
                      style: TextStyle(
                        fontFamily: 'OpenSans_regular',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                    TextSpan(
                      text: name.isNotEmpty ? name : 'User',
                      style: const TextStyle(
                        fontFamily: 'OpenSans_bold',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: usernameBlue,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                "No notifications need your attention",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(height: 18),
              buildComplaintsCard(),
              buildQuickActions(),
              buildMessTodayCard(),
              const SizedBox(height: 22),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
        elevation: 12,
        selectedItemColor: usernameBlue,
        unselectedItemColor: Colors.black54,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: _onNavTap,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu_rounded),
            label: "Mess",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.report_gmailerrorred_rounded),
            label: "Complaints",
          ),
        ],
      ),
    );
  }
}
