import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';
import 'package:http/http.dart' as http;

import '../../constants/endpoints.dart';

import 'package:frontend/database/hive_store.dart';
import 'package:frontend/models/user.dart';
import '../../screens/login_screen.dart';
import 'package:frontend/apis/protected.dart';
import 'package:frontend/apis/User/user.dart';

Future<void> authenticate() async {
  try {

      final result = await FlutterWebAuth.authenticate(
          url: AuthEndpoints.getAccess, callbackUrlScheme: "iitgcomplain");

    final code = Uri.parse(result).queryParameters['code'];

    if(code!= null){
      await exchangeCodeForToken(code);
    }
    await setHiveStore();
    await fetchUserDetails();
  } on PlatformException catch (_) {
    rethrow;
  } catch (e) {
    rethrow;
  }
}

Future<void> exchangeCodeForToken(String authCode) async {
  final tokenUrl = Uri.parse(tokenlink.Tokenlink);

  try {
    final response = await http.post(
      tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        'client_id': clientid.Clientid,
        'grant_type': 'authorization_code',
        'code': authCode,
        'redirect_uri': redirecturi.Redirecturi,
        'scope': 'offline_access User.Read',
      },
    );

    if (response.statusCode == 200) {
      final tokenData = json.decode(response.body);
      final accessToken = tokenData['access_token'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', accessToken);

    } else {
      print('Failed to exchange authorization code for token. Status code: ${response.statusCode}');
      print('Response body: ${response.body}');
      throw Exception('Token exchange failed');
    }
  } catch (e) {
    print('Error during token exchange: $e');
    throw e;
  }
}




Future<void> logoutHandler(context) async {
  final prefs = await SharedPreferences.getInstance();
  final box = await Hive.openBox('coursehub-data');

  prefs.clear();
  box.clear();
  HiveStore.clearHiveData();

  Navigator.of(context).pushAndRemoveUntil(
    MaterialPageRoute(
      builder: (context) => const loginScreen(),
    ),
        (route) => false,
  );
}

Future<bool> isLoggedIn() async {
  var access = await getAccessToken();

  if (access != 'error') {
    await setHiveStore();
    return true;
  } else {
    return false;
  }
}