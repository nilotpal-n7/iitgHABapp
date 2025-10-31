import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:frontend2/apis/mess/user_mess_info.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/apis/users/user.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/main.dart';
import 'package:frontend2/providers/feedback_provider.dart';
import 'package:frontend2/providers/hostels.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:dio/dio.dart';
import 'package:frontend2/utilities/notifications.dart';
import '../../screens/login_screen.dart';

Future<void> authenticate() async {
  try {
    final result = await FlutterWebAuth2.authenticate(
        url: AuthEndpoints.getAccess, callbackUrlScheme: "iitgcomplain");

    print("result: $result");

    final accessToken = Uri.parse(result).queryParameters['token'];
    print("access token is");

    debugPrint(accessToken);

    final prefs = await SharedPreferences.getInstance();

    if (accessToken == null) {
      throw ('access token not found');
    }

    prefs.setString('access_token', accessToken);
    await fetchUserDetails();
    await getUserMessInfo();
    await registerFcmToken();
    await HostelsNotifier.init();
    ProfilePictureProvider.init();
  } on PlatformException catch (_) {
    rethrow;
  } catch (e, st) {
    // Better debugging output: print the error and stacktrace so we can see why
    // FlutterWebAuth2 failed to return the expected redirect URL (or token).
    print('Error in getting code: $e');
    print(st);
    rethrow;
  }
}

Future<void> logoutHandler(context) async {
  try {
    final dio = Dio();
    // Don't throw on non-2xx so we can handle 404s gracefully
    await dio.get('${baseUrl}/auth/logout',
        options: Options(validateStatus: (status) => true));
  } catch (e) {
    print('Warning: server logout failed: $e');
  }

  final prefs = await SharedPreferences.getInstance();
  await prefs.clear();
  // Use the global navigator if available; the dialog's build context may be
  // deactivated after calling Navigator.pop() in the dialog. This avoids the
  // "Looking up a deactivated widget's ancestor is unsafe" error.
  final navContext = navigatorKey.currentContext ?? context;
  if (navContext.mounted) {
    Navigator.of(navContext).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (context) => const LoginScreen(),
      ),
      (route) => false,
    );
  } else {
    // As a fallback, attempt push using the provided context (may still fail
    // if deactivated). We keep it inside try/catch to avoid crashing the app.
    try {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
        (route) => false,
      );
    } catch (e) {
      print('Navigation to login failed: $e');
    }
  }
}

Future<void> signInWithApple() async {
  try {
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    print('User ID: ${credential.userIdentifier}');
    print('Email: ${credential.email}');
    print('Full Name: ${credential.givenName} ${credential.familyName}');
  } catch (e) {
    print('Error during Apple Sign-In: $e');
  }
}

Future<bool> isLoggedIn() async {
  var access = await getAccessToken();

  if (access != 'error') {
    return true;
  } else {
    return false;
  }
}
