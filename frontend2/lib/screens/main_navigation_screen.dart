import 'package:flutter/material.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:frontend2/screens/mess_preference.dart';
import 'package:frontend2/screens/profile_screen.dart';
import 'package:frontend2/apis/dio_client.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'home_screen.dart';
import 'mess_screen.dart';
import 'gala_dinner_screen.dart';
import '../utilities/notifications.dart';

import '../widgets/common/bottom_nav_bar.dart';

final _dio = DioClient().dio;

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;
  bool _showGalaTab = false;

  void _handleNavTap(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void initState() {
    super.initState();
    _resolveGalaTabVisibility();
    // Listen for navigation from notifications
    tabNavigationNotifier.addListener(_onTabNavigationRequested);
    deepNavigationNotifier.addListener(_onDeepNavigationRequested);
  }

  /// Gala tab: for SMC show when any upcoming gala; for non-SMC show only when
  /// gala date is within 3 days (visible from galaDate-2 days through gala date).
  Future<void> _resolveGalaTabVisibility() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isSMC = prefs.getBool('isSMC') ?? false;
      final response = await _dio.get(GalaEndpoints.upcoming);
      final galaData = response.data;
      final galaDateRaw = galaData is Map ? galaData['date'] : null;
      if (galaDateRaw == null) {
        if (mounted) setState(() => _showGalaTab = false);
        return;
      }
      DateTime? galaDate;
      if (galaDateRaw is String) {
        galaDate = DateTime.tryParse(galaDateRaw)?.toLocal();
      } else if (galaDateRaw is DateTime) {
        galaDate = galaDateRaw.toLocal();
      }
      if (galaDate == null) {
        if (mounted) setState(() => _showGalaTab = false);
        return;
      }
      final galaDay = DateTime(galaDate.year, galaDate.month, galaDate.day);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final daysUntil = galaDay.difference(today).inDays;
      // Non-SMC: show only when 0 <= daysUntil <= 2 (i.e. within 3 days: today, tomorrow, day after)
      final show = isSMC ? (daysUntil >= 0) : (daysUntil >= 0 && daysUntil <= 2);
      if (mounted) {
        setState(() {
          _showGalaTab = show;
          if (!show && _selectedIndex == 2) _selectedIndex = 0;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _showGalaTab = false);
    }
  }

  void _onTabNavigationRequested() {
    final targetTab = tabNavigationNotifier.value;
    if (targetTab != null && targetTab != _selectedIndex) {
      setState(() {
        _selectedIndex = targetTab;
      });
      // Clear the navigation request
      tabNavigationNotifier.value = null;
    }
  }

  void _onDeepNavigationRequested() {
    final screenName = deepNavigationNotifier.value;
    if (screenName != null && mounted) {
      // Capture navigator before creating an async gap and wait briefly
      final navigator = Navigator.of(context);
      // Wait for tab navigation to complete
      Future.delayed(const Duration(milliseconds: 100), () {
        if (!mounted) return;

        switch (screenName) {
          case 'mess_change_screen':
            navigator.push(
              MaterialPageRoute(
                builder: (context) => const MessChangePreferenceScreen(),
              ),
            );
            break;
          case 'profile_screen':
            navigator.push(
              MaterialPageRoute(
                builder: (context) => const ProfileScreen(),
              ),
            );
            break;
        }

        // Clear the navigation request
        deepNavigationNotifier.value = null;
      });
    }
  }

  @override
  void dispose() {
    tabNavigationNotifier.removeListener(_onTabNavigationRequested);
    deepNavigationNotifier.removeListener(_onDeepNavigationRequested);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onNavigateToTab: _handleNavTap),
      const MessScreen(),
      const GalaDinnerScreen(),
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
                showGalaTab: _showGalaTab,
              )
            : const SizedBox(),
      ),
    );
  }
}
