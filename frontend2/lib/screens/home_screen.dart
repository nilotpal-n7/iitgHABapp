import 'dart:convert';
import 'package:flutter/material.dart';

import 'package:frontend1/constants/endpoint.dart';
import 'package:frontend1/screens/profile_screen.dart';
import 'package:frontend1/screens/qr_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend1/widgets/common/name_trimmer.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:http/http.dart' as http;
import 'package:frontend1/models/mess_menu_model.dart';
import 'package:frontend1/widgets/mess_widgets/messmenu.dart';
import 'package:frontend1/widgets/complaint_dropdown.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String name = '';
  int _selectedIndex = 0;
 bool feedbackform=true;
  String? messId;
  String? token;

  @override
  void initState() {
    super.initState();
    fetchUserData();
    fetchMessIdAndToken();
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


  Future<void> fetchMessIdAndToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      messId = '6826dfda8493bb0870b10cbf';
      token = prefs.getString('access_token');
    });
  }

  void _onNavTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget buildQuickActions() {
    const usernameBlue = Color(0xFF3754DB);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18.0),
      child: Row(
        children: [
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
          const SizedBox(width: 16),
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const QrScan()),
                );

              },
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
                      'assets/icon/qrscan.svg',
                      width: 32,
                      height: 32,
                      color: const Color(0xFF3754DB),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Scan Mess QR",
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

  String getTodayDay() {
    final now = DateTime.now();
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    return days[now.weekday - 1];
  }


  DateTime _parseTime(String timeStr) {
    final now = DateTime.now();
    final parts = timeStr.split(':');
    return DateTime(
      now.year,
      now.month,
      now.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }


  String _formatDuration(Duration d) {
    if (d.inSeconds <= 0) return "Ended";
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    if (h > 0) {
      return "${h}h ${m}m";
    } else {
      return "${m}m";
    }
  }

  Future<List<MenuModel>> fetchTodayMenu() async {
    if (messId == null || token == null) {
      await fetchMessIdAndToken();
      if (messId == null || token == null) {
        throw Exception('Mess ID or token not available');
      }
    }
    final url = Uri.parse('$baseUrl/mess/menu/$messId');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'day': getTodayDay()}),
    );
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => MenuModel.fromJson(json)).toList();
    } else {
      print(response.body);
      throw Exception('Failed to load menu');
    }
  }

  Widget buildMessTodayCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: const [
              Text(
                "In Mess Today",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
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
        ),

        const SizedBox(height: 8),
        FutureBuilder<List<MenuModel>>(
          future: fetchTodayMenu(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Card(
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(24)),
                  side: BorderSide(color: Color(0xC5C5D1), width: 1),

                ),
                elevation: 0.5,
                child: Padding(
                  padding: EdgeInsets.all(18.0),
                  child: Center(child: CircularProgressIndicator()),
                ),
              );
            } else if (snapshot.hasError) {
              return Card(
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: Color(0xC5C5D1), width: 1),
                ),
                elevation: 0.5,
                child: Padding(
                  padding: const EdgeInsets.all(18.0),
                  child: Text(
                    'Error loading menu: ${snapshot.error}',
                    style: const TextStyle(color: Colors.red),
                  ),
                ),

              );
            } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0.5,
                child: const Padding(
                  padding: EdgeInsets.all(18.0),
                  child: Text(
                    'No menu available today.',
                    style: TextStyle(fontSize: 15, color: Colors.black54),
                  ),
                ),
              );
            }

            return MessMenuCard(
              menus: snapshot.data!,
              now: DateTime.now(),
              parseTime: _parseTime,
              formatDuration: _formatDuration,
            );
          },
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
          padding: const EdgeInsets.symmetric(horizontal: 16.0,),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 13.5),
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
              const SizedBox(height: 8),
              const Text(
                "No notifications need your attention",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 24),
              ComplaintsCard(feedbackform: feedbackform,),
              buildQuickActions(),
              buildMessTodayCard(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
