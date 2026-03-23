import 'dart:convert';

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:frontend2/providers/hostels.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:frontend2/screens/laundry/laundry_screen.dart';
import 'package:frontend2/screens/profile_screen.dart';
import 'package:frontend2/screens/qr_scanner.dart';
import 'package:frontend2/utilities/notifications.dart';
import 'package:frontend2/widgets/common/name_trimmer.dart';
import 'package:frontend2/widgets/mess_widgets/MessMenuBuilder.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utilities/startupitem.dart';
import '../widgets/alerts_card.dart';
import '../widgets/microsoft_required_dialog.dart';
import 'mess_preference.dart';
import 'leave_application_screen.dart';
import 'room_cleaning/room_cleaning.dart';

class HomeScreen extends StatefulWidget {
  final void Function(int)? onNavigateToTab;
  final VoidCallback? onRefresh;
  const HomeScreen({super.key, this.onNavigateToTab, this.onRefresh});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String name = '';
  bool feedbackform = true;
  String currSubscribedMess = '';
  String? token;
  String? userHostelId;

  @override
  void initState() {
    super.initState();
    fetchUserData();
    fetchMessIdAndToken();
    homeScreenRefreshNotifier.addListener(_onRefreshRequested);
  }

  @override
  void dispose() {
    homeScreenRefreshNotifier.removeListener(_onRefreshRequested);
    super.dispose();
  }

  void _onRefreshRequested() {
    if (homeScreenRefreshNotifier.value) {
      fetchUserData();
      fetchMessIdAndToken();
      homeScreenRefreshNotifier.value = false;
    }
  }

  Future<void> fetchUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final name1 = prefs.getString('name');
    if (name1 != null) {
      setState(() {
        name = capitalizeWords(name1).split(' ').first;
      });
    }
  }

  String getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return "Good morning, ";
    } else if (hour < 18) {
      return "Good afternoon, ";
    } else {
      return "Good evening, ";
    }
  }

  Future<void> fetchMessIdAndToken() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      currSubscribedMess = prefs.getString('messID') ?? '';
      token = prefs.getString('access_token');
      userHostelId = prefs.getString('hostel') ?? prefs.getString('hostelID');
    });
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

  // ── Quick action data ────────────────────────────────────────────────────────

  static const TextStyle _labelStyle = TextStyle(
    color: Colors.black,
    fontWeight: FontWeight.w600,
    fontSize: 12,
  );

  Widget _buildLabel(String label) {
    final parts = label.split(' ');
    if (parts.length >= 2) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(parts[0], textAlign: TextAlign.center, style: _labelStyle),
          Text(parts.sublist(1).join(' '),
              textAlign: TextAlign.center, style: _labelStyle),
        ],
      );
    }
    return Text(label,
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: _labelStyle);
  }

  Widget _quickCard({
    required String label,
    String iconPath = '',
    IconData? iconData,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFF3754DB),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: iconData != null
                    ? Icon(iconData, size: 22, color: Colors.white)
                    : SvgPicture.asset(
                        iconPath,
                        colorFilter: const ColorFilter.mode(
                            Colors.white, BlendMode.srcIn),
                        width: 22,
                        height: 22,
                      ),
              ),
            ),
            const SizedBox(height: 8),
            _buildLabel(label),
          ],
        ),
      ),
    );
  }

  // ── Microsoft gate helper ───────────────────────────────────────────────────

  Future<bool> _checkMicrosoft(String featureName) async {
    final prefs = await SharedPreferences.getInstance();
    final linked = prefs.getBool('hasMicrosoftLinked') ?? false;
    if (!linked && mounted) {
      showDialog(
        context: context,
        builder: (_) =>
            MicrosoftRequiredDialog(featureName: featureName),
      );
    }
    return linked;
  }

  // ── Grid of all cards ───────────────────────────────────────────────────────

  Widget buildQuickActions() {
    final hasLaundry =
        HostelsNotifier.isLaundryAvailableForHostel(userHostelId);

    return LayoutBuilder(
      builder: (context, constraints) {
        // 4 columns; gap between them
        const crossCount = 4;
        const gap = 10.0;
        final cardWidth =
            (constraints.maxWidth - gap * (crossCount - 1)) / crossCount;

        final items = <Widget>[
          // Scan QR
          _quickCard(
            label: 'Scan QR',
            iconPath: 'assets/icon/qrscan.svg',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const QrScan()),
            ),
          ),

          // Room Cleaning
          _quickCard(
            label: 'Room Cleaning',
            iconData: Icons.cleaning_services_rounded,
            onTap: () async {
              if (!await _checkMicrosoft('Room Cleaning')) return;
              if (!mounted) return;
              Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const RoomCleaningScreen()));
            },
          ),

          // Mess Change
          _quickCard(
            label: 'Mess Change',
            iconPath: 'assets/icon/messicon.svg',
            onTap: () async {
              if (!await _checkMicrosoft('Mess Change')) return;
              if (!mounted) return;
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const MessChangePreferenceScreen()));
            },
          ),

          // Mess Rebate
          _quickCard(
            label: 'Mess Rebate',
            iconPath: 'assets/icon/messicon.svg',
            onTap: () async {
              if (!await _checkMicrosoft('Mess Rebate')) return;
              if (!mounted) return;
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const LeaveApplicationScreen()));
            },
          ),

          // Laundry (conditional)
          if (hasLaundry)
            _quickCard(
              label: 'Laundry Service',
              iconData: Icons.local_laundry_service_rounded,
              onTap: () async {
                if (!await _checkMicrosoft('Laundry Service')) return;
                if (!mounted) return;
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const LaundryScreen()));
              },
            ),
        ];

        // Build rows of crossCount
        final rows = <Widget>[];
        for (int i = 0; i < items.length; i += crossCount) {
          final rowItems = items.sublist(
              i, i + crossCount > items.length ? items.length : i + crossCount);

          rows.add(
            Row(
              children: List.generate(rowItems.length * 2 - 1, (idx) {
                if (idx.isOdd) return const SizedBox(width: gap);
                final card = rowItems[idx ~/ 2];
                return SizedBox(width: cardWidth, child: card);
              }),
            ),
          );

          if (i + crossCount < items.length) {
            rows.add(const SizedBox(height: gap));
          }
        }

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 18.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: rows,
          ),
        );
      },
    );
  }

  // ── Mess today card ─────────────────────────────────────────────────────────

  Widget buildMessTodayCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                "In Mess Today",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              GestureDetector(
                onTap: () => widget.onNavigateToTab?.call(1),
                child: const Text(
                  "Go to Mess",
                  style: TextStyle(
                    color: Color(0xFF3754DB),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Consumer<MessInfoProvider>(
          builder: (context, messProvider, child) {
            if (messProvider.isLoading) {
              return const Card(
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.all(Radius.circular(24)),
                  side: BorderSide(color: Color(0xFFC5C5D1), width: 1),
                ),
                elevation: 0.5,
                child: Padding(
                  padding: EdgeInsets.all(18.0),
                  child: Center(child: CircularProgressIndicator()),
                ),
              );
            }
            return MenuFutureBuilder(
              messId: currSubscribedMess,
              day: getTodayDay(),
            );
          },
        ),
      ],
    );
  }

  // ── Build ───────────────────────────────────────────────────────────────────

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
            focusColor: Colors.transparent,
            hoverColor: Colors.transparent,
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
            child: ValueListenableBuilder(
              valueListenable: ProfilePictureProvider.profilePictureString,
              builder: (context, value, child) {
                final String b64 = value;
                return CircleAvatar(
                  radius: 16,
                  backgroundColor: Colors.transparent,
                  backgroundImage: b64.isNotEmpty
                      ? MemoryImage(base64Decode(b64))
                      : const AssetImage('assets/images/default_profile.png'),
                );
              },
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
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 13.5),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: getGreeting(),
                      style: const TextStyle(
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
                style: TextStyle(fontSize: 14, color: Colors.black87),
              ),
              const SizedBox(height: 24),
              AlertsCard(feedbackform: feedbackform),
              ValueListenableBuilder<List<String>>(
                valueListenable: HostelsNotifier.hostelNotifier,
                builder: (context, _, __) => buildQuickActions(),
              ),
              if (currSubscribedMess.isNotEmpty) buildMessTodayCard(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}