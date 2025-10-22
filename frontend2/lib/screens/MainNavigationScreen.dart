import 'package:flutter/material.dart';
import 'package:frontend2/providers/feedback_provider.dart';
import 'package:frontend2/screens/complaints_screen.dart';
import 'package:frontend2/screens/mess_feedback/mess_feedback_page.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:frontend2/screens/profile_screen.dart';
import 'package:frontend2/utilities/ComingSoon.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'home_screen.dart';
import 'mess_screen.dart';
//import 'complaints_screen.dart';  //for future

import '../widgets/common/bottom_nav_bar.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  void _handleNavTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onNavigateToTab: _handleNavTap),
      const MessScreen(),
      const ComingSoonScreen(),
    ];
    return ValueListenableBuilder(
      valueListenable: ProfilePictureProvider.isSetupDone,
      builder: (context, setupDone, child) => Scaffold(
        body: (setupDone == true)
            ? IndexedStack(
                index: _selectedIndex,
                children: screens,
              )
            : const InitialSetupScreen(),
        bottomNavigationBar: (setupDone == true)
            ? BottomNavBar(
                currentIndex: _selectedIndex,
                onTap: _handleNavTap,
              )
            : const SizedBox(),
      ),
    );
  }
}
