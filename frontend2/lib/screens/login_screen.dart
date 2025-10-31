import 'package:flutter/material.dart';
import 'package:frontend2/apis/authentication/login.dart';
import 'package:frontend2/screens/MainNavigationScreen.dart';
import 'package:frontend2/widgets/common/snack_bar.dart';
import 'package:frontend2/widgets/login screen/login_button.dart';
import 'package:lottie/lottie.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Hostel App',
      theme: ThemeData(
        primaryColor: const Color(0xFF0D1D40),
        scaffoldBackgroundColor: const Color(0xFF0D1D40),
      ),
      home: const OnboardingScreen(),
    );
  }
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  bool _inprogress = false;
  
  // Next dbane ke baad GPT kia so yeah
  void _showBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Stack(
              children: [
                FractionallySizedBox(
                  heightFactor: 0.3,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(24),
                        topRight: Radius.circular(24),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Sign in',
                            style: TextStyle(
                              fontFamily: 'GeneralSans',
                              fontWeight: FontWeight.w600,
                              fontSize: 32,
                            ),
                          ),
                          const Divider(),
                          const Text(
                            'For Students',
                            style: TextStyle(
                              fontFamily: 'GeneralSans',
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                              color: Color(0xFF676767),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            height: 48,
                            width: double.infinity,
                            child: Material(
                              color: const Color(0xFF4C4EDB),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(50),
                              ),
                              child: InkWell(
                                splashColor: Colors.white,
                                onTap: () async {
                                  try {
                                    setModalState(() {
                                      _inprogress = true;
                                    });
                                    await authenticate();
                                    setModalState(() {
                                      _inprogress = false;
                                    });
                                    if (!mounted) return;
                                    Navigator.pushReplacement(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            const MainNavigationScreen(),
                                      ),
                                    );
                                    showSnackBar('Successfully Logged In',
                                        Colors.black, context);
                                  } catch (e) {
                                    setModalState(() {
                                      _inprogress = false;
                                    });
                                    showSnackBar('Something Went Wrong',
                                        Colors.black, context);
                                  }
                                },
                                child: const Padding(
                                  padding: EdgeInsets.all(15),
                                  child: LoginButton(),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                        ],
                      ),
                    ),
                  ),
                ),

                // Lottie loader overlay
                if (_inprogress)
                  Positioned.fill(
                    child: AbsorbPointer(
                      absorbing: true, // Disable taps when loading
                      child: Container(
                        color: Colors.black.withOpacity(0.7),
                        child: Center(
                          child: Lottie.asset(
                            'assets/lottie/loader.json', // your loader path
                            width: 240,
                            height: 240,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    //Note we have to take care of every screen this app runs so from bginning we have to make sure screensize
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.height < 700; //doesnt exist

    return Scaffold(
      body: Container(
        color: const Color(0xFF0D1D40),
        child: SafeArea(
          child: Stack(
            children: [
              // Background frame
              Positioned.fill(
                top: MediaQuery.of(context).size.height * 0.3,
                child: Image.asset(
                  'assets/images/Phone.png',
                  fit: BoxFit.contain,
                ),
              ),

              // Main Content
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Adjust top spacing based on screen size small screen size
                    SizedBox(
                        height: isSmallScreen ? 20.0 : 40.0), // 20 40 is fine

                    // Header Frame with Welcome text
                    Center(
                      child: Container(
                        width: screenSize.width *
                            0.9, // Responsive width // no changes here needed
                        height:
                            isSmallScreen ? 120.0 : 152.0, // Responsive height
                        child: const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Welcome to',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                'HAB APP',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: Color(
                                      0xFFAFB9D2),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Adjustable spacing based on screen size
                    SizedBox(
                        height: isSmallScreen ? 24.0 : 48.0), // here it is fine

                    // Feature buttons Stack in a flexible container
                    Expanded(
                      flex: 3, // Give it proportional space
                      child: LayoutBuilder(
                        // this logic is IMP
                        builder: (context, constraints) {
                          // Calculate scaling factor based on available height
                          final double scaleFactor =
                              constraints.maxHeight / 240.0;
                          return Stack(
                            fit: StackFit.expand, // Use all available space
                            children: [
                              // Feedbacks button
                              Positioned(
                                left: 20 * scaleFactor,
                                top: 20 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Feedbacks',
                                  color: Color(0xFF1F7157), // Green
                                  imagePath:
                                      'assets/images/features/feedback.png',
                                ),
                              ),

                              // Canteens button
                              Positioned(
                                right: 20 * scaleFactor,
                                top: 20 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Canteens',
                                  color: Color(0xFF4E46B4), // Purple
                                  imagePath:
                                      'assets/images/features/canteens.png',
                                ),
                              ),

                              // Mess button
                              Positioned(
                                left: 50 * scaleFactor,
                                top: 90 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Mess',
                                  color: Color(0xFF4E46B4), // Purple
                                  imagePath: 'assets/images/features/mess.png',
                                ),
                              ),

                              // Complaints button
                              Positioned(
                                right: 50 * scaleFactor,
                                top: 100 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Complaints',
                                  color: Color(0xFFD14B65), // Red
                                  imagePath:
                                      'assets/images/features/complaints.png',
                                ),
                              ),

                              // Updates button
                              Positioned(
                                left: 40 * scaleFactor,
                                top: 160 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Updates',
                                  color: Color(0xFFB27C38), // Orange/Brown
                                  imagePath:
                                      'assets/images/features/updates.png',
                                ),
                              ),

                              // Schedules button
                              Positioned(
                                right: 40 * scaleFactor,
                                top: 160 * scaleFactor,
                                child: const FeatureButton(
                                  text: 'Schedules',
                                  color: Color(0xFF1F7157), // Green
                                  imagePath:
                                      'assets/images/features/schedules.png',
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),

                    //  to handle overflow when testing on different devices
                    const Expanded(
                      flex: 1,
                      child: SingleChildScrollView(
                        child: Column(
                          children: [
                            Text(
                              'A space built around your hostel life.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'From mess feedback to shared complaints, from schedules to updates, everything you need is now just a tap away.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Next Button - In SafeArea to avoid bottom system UI(IMP)
                    SafeArea(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16.0),
                        child: ElevatedButton(
                          onPressed: () {
                            // make sure to Show bottom sheet when Next is tapped
                            _showBottomSheet(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                const Color(0xFF6149CD), // Purple color
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30.0),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 16.0),
                          ),
                          child: const Text(
                            'Get Started',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// made a widget for above feature buttons
class FeatureButton extends StatelessWidget {
  final String text;
  final Color color;
  final String imagePath;

  const FeatureButton({
    Key? key,
    required this.text,
    required this.color,
    required this.imagePath,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    );

  }
}
