import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:frontend1/apis/authentication/login.dart';
import 'package:frontend1/screens/Home_screen.dart';
import 'package:frontend1/screens/login_screen.dart';


Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bool asLoggedIn = await isLoggedIn();
  runApp(MyApp(isLoggedIn: asLoggedIn));
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class MyApp extends StatelessWidget {
  final bool isLoggedIn;

  const MyApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.black,
        systemNavigationBarColor: Colors.black,
      ),
    );
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      navigatorKey: navigatorKey,
      home: isLoggedIn ? HomeScreen() : loginScreen(),
      builder: EasyLoading.init(),
    );
  }
}
