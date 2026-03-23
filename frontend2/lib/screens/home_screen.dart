import 'dart:convert';

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
// removed unused imports: feedback_provider, complaints_screen, mess_feedback_page
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
import 'room_cleaning/room_cleaning.dart';
import 'leave_application_screen.dart';

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
  Timer? _quickNavTimer;
  final PageController _quickNavPageController = PageController(viewportFraction: 1 / 3);

  @override
  void initState() {
    super.initState();
    fetchUserData();
    fetchMessIdAndToken();
    homeScreenRefreshNotifier.addListener(_onRefreshRequested);
  }

  @override
  void dispose() {
    _quickNavTimer?.cancel();
    _quickNavPageController.dispose();
    homeScreenRefreshNotifier.removeListener(_onRefreshRequested);
    super.dispose();
  }

  void _onRefreshRequested() {
    if (homeScreenRefreshNotifier.value) {
      fetchUserData();
      fetchMessIdAndToken();
      homeScreenRefreshNotifier.value = false; // Reset
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

  // Add the missing getTodayDay method
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

  List<Widget> _buildQuickActionCards() {
    // Use only the user's hostel schema (isLaundryAvailable from /hostel/all).
    // Do not call laundry getStatus here; that runs only on the Laundry page.
    final hasLaundry = HostelsNotifier.isLaundryAvailableForHostel(userHostelId);
    final cards = <Widget>[
      _wrapQuickCard(
        iconPath: 'assets/icon/qrscan.svg',
        label: 'Scan QR',
        iconData: null,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const QrScan()),
          );
        },
      ),
      _wrapQuickCard(
        iconPath: 'assets/icon/cleaning.svg',
        label: 'Room Cleaning',
        iconData: Icons.cleaning_services_rounded,
        onTap: () async {
          final prefs = await SharedPreferences.getInstance();
          final hasMicrosoftLinked =
              prefs.getBool('hasMicrosoftLinked') ?? false;
          if (!mounted) return;
          if (!hasMicrosoftLinked) {
            showDialog(
              context: context,
              builder: (context) => const MicrosoftRequiredDialog(
                featureName: 'Room Cleaning',
              ),
            );
            return;
          }
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const RoomCleaningScreen(),
            ),
          );
        },
      ),
      _wrapQuickCard(
        iconPath: 'assets/icon/messicon.svg',
        label: 'Mess Change',
        iconData: null,
        onTap: () async {
          final prefs = await SharedPreferences.getInstance();
          final hasMicrosoftLinked =
              prefs.getBool('hasMicrosoftLinked') ?? false;
          if (!mounted) return;
          if (!hasMicrosoftLinked) {
            showDialog(
              context: context,
              builder: (context) => const MicrosoftRequiredDialog(
                featureName: 'Mess Change',
              ),
            );
            return;
          }
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const MessChangePreferenceScreen(),
            ),
          );
        },
      ),
      _wrapQuickCard(
        iconPath: 'assets/icon/messicon.svg',
        label: 'Mess Rebate',
        iconData: null,
        onTap: () async {
          final prefs = await SharedPreferences.getInstance();
          final hasMicrosoftLinked =
              prefs.getBool('hasMicrosoftLinked') ?? false;
          if (!mounted) return;
          if (!hasMicrosoftLinked) {
            showDialog(
              context: context,
              builder: (context) => const MicrosoftRequiredDialog(
                featureName: 'Mess Rebate',
              ),
            );
            return;
          }
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const LeaveApplicationScreen(),
            ),
          );
        },
      ),
    ];
    if (hasLaundry) {
      cards.add(
        _wrapQuickCard(
          iconPath: '',
          label: 'Laundry Service',
          iconData: Icons.local_laundry_service_rounded,
          onTap: () async {
            final prefs = await SharedPreferences.getInstance();
            final hasMicrosoftLinked =
                prefs.getBool('hasMicrosoftLinked') ?? false;
            if (!mounted) return;
            if (!hasMicrosoftLinked) {
              showDialog(
                context: context,
                builder: (context) => const MicrosoftRequiredDialog(
                  featureName: 'Laundry Service',
                ),
              );
              return;
            }
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const LaundryScreen(),
              ),
            );
          },
        ),
      );
    }
    return cards;
  }

  Widget _wrapQuickCard({
    required String iconPath,
    required String label,
    IconData? iconData,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: _quickActionCard(
        iconPath: iconPath,
        label: label,
        iconData: iconData,
      ),
    );
  }

  Widget buildQuickActions() {
    final cards = _buildQuickActionCards();
    final useSlider = cards.length >= 4;

    if (!useSlider) {
      _quickNavTimer?.cancel();
      _quickNavTimer = null;

      // 3 cards: static Row (no sliding) with even spacing
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 18.0),
        child: Row(
          children: [
            Expanded(child: cards[0]),
            const SizedBox(width: 16),
            Expanded(child: cards[1]),
            const SizedBox(width: 16),
            Expanded(child: cards[2]),
          ],
        ),
      );
    }

    // Infinite loop: use a huge itemCount with modulo indexing.
    // Start in the middle to allow scrolling in both directions.
    const int virtualCount = 100000;
    const int startPage = virtualCount ~/ 2;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      // Jump to a clean starting point without animation
      if (_quickNavPageController.hasClients) {
        _quickNavPageController.jumpToPage(startPage);
      }

      // Cancel any existing timer before creating a new one
      _quickNavTimer?.cancel();
      _quickNavTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        if (!mounted || !_quickNavPageController.hasClients) return;
        final nextPage = (_quickNavPageController.page ?? startPage).round() + 1;
        _quickNavPageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 450),
          curve: Curves.easeInOut,
        );
      });
    });

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18.0),
      child: SizedBox(
        height: 106,
        child: PageView.builder(
          controller: _quickNavPageController,
          itemCount: virtualCount,
          padEnds: false,
          physics: const NeverScrollableScrollPhysics(),
          itemBuilder: (context, index) {
            final cardIndex = index % cards.length;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: cards[cardIndex],
            );
          },
        ),
      ),
    );
  }

  static const TextStyle _quickActionLabelStyle = TextStyle(
    color: Colors.black,
    fontWeight: FontWeight.w600,
    fontSize: 14,
  );

  Widget _buildQuickActionLabel(String label) {
    final parts = label.split(' ');
    if (parts.length == 2) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            parts[0],
            textAlign: TextAlign.center,
            style: _quickActionLabelStyle,
          ),
          Text(
            parts[1],
            textAlign: TextAlign.center,
            style: _quickActionLabelStyle,
          ),
        ],
      );
    }
    return Text(
      label,
      textAlign: TextAlign.center,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: _quickActionLabelStyle,
    );
  }

  Widget _quickActionCard({
    required String iconPath,
    required String label,
    IconData? iconData,
  }) {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFFFF),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        mainAxisSize: MainAxisSize.max,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFF3754DB),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: iconData != null
                  ? Icon(
                      iconData,
                      size: 22,
                      color: Colors.white,
                    )
                  : SvgPicture.asset(
                      iconPath,
                      colorFilter: const ColorFilter.mode(
                        Colors.white,
                        BlendMode.srcIn,
                      ),
                      width: 22,
                      height: 22,
                    ),
            ),
          ),
          _buildQuickActionLabel(label),
        ],
      ),
    );
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
            children: [
              const Text(
                "In Mess Today",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
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
            // Fixed null safety issues
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

            final messId = currSubscribedMess;

            return MenuFutureBuilder(
              messId: messId,
              day: getTodayDay(),
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
            focusColor: Colors.transparent,
            hoverColor: Colors.transparent,
            splashColor: Colors.transparent,
            highlightColor: Colors.transparent,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfileScreen()),
              );
            },
            child: ValueListenableBuilder(
              valueListenable: ProfilePictureProvider.profilePictureString,
              builder: (context, value, child) {
                final String b64 = value;

                return CircleAvatar(
                  radius: 16,
                  // prefer transparent bg so default asset is visible
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
          padding: const EdgeInsets.symmetric(
            horizontal: 16.0,
          ),
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
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 24),
              AlertsCard(
                feedbackform: feedbackform,
              ),
              ValueListenableBuilder<List<String>>(
                valueListenable: HostelsNotifier.hostelNotifier,
                builder: (context, _, __) => buildQuickActions(),
              ),
              // Only show "In Mess Today" if mess exists
              if (currSubscribedMess.isNotEmpty) buildMessTodayCard(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
