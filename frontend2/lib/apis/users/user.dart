import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Update the authenticated user's roomNumber and phoneNumber via server
/// Returns true on success, false otherwise.
Future<bool> saveUserProfileFields(
    {String? roomNumber, String? phoneNumber}) async {
  final header = await getAccessToken();
  if (header == 'error') return false;

  try {
    final body = <String, dynamic>{};
    if (roomNumber != null) body['roomNumber'] = roomNumber;
    if (phoneNumber != null) body['phoneNumber'] = phoneNumber;

    final resp = await http.post(
      Uri.parse(UserEndpoints.saveUser),
      headers: {
        'Authorization': 'Bearer $header',
        'Content-Type': 'application/json',
      },
      body: json.encode(body),
    );

    return resp.statusCode == 200;
  } catch (e) {
    debugPrint('saveUserProfileFields error: $e');
    return false;
  }
}

Future<Map<String, String>?> fetchUserDetails() async {
  final header = await getAccessToken();

  debugPrint("token is $header");
  if (header == 'error') {
    throw ('token not found');
  }
  try {
    final resp = await http.get(
      Uri.parse(UserEndpoints.currentUser),
      headers: {
        "Authorization": "Bearer $header", //make sure to include Bearer
        "Content-Type": "application/json",
      },
    );
    debugPrint('Response headers: ${resp.headers}');

    if (resp.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      final Map<String, dynamic> userData = json.decode(resp.body);

      debugPrint("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!UserData: $userData");

      // Extract user details
      final String name = userData['name'] ?? "User";
      final String userId = userData['_id'] ?? "";
      final String mail = userData['email'];
      final String roll = userData['rollNumber'] ?? "Not provided";
      final String currSubscribedMess =
          userData['curr_subscribed_mess'] ?? "Not provided";
      final String appliedMess =
          userData['applied_hostel_string'] ?? "Not provided";
      final String hostel = userData['hostel'] ?? "Not provided";
      final bool gotHostel = userData['got_mess_changed'];
      final bool isSMC = userData['isSMC'] ?? false;
      final bool isSetupDone = userData['isSetupDone'] == true;
      final String roomNumber = (userData['roomNumber'] ?? '') as String;
      final String phoneNumber = (userData['phoneNumber'] ?? '') as String;

      // print("IS SMCCCC: ${userData['isSMC']}, $isSMC");

      prefs.setBool('isSMC', isSMC);
      prefs.setBool('gotMess', gotHostel);
      prefs.setString('email', mail);
      prefs.setString('rollNumber', roll);
      prefs.setString('appliedMess', appliedMess);
      prefs.setString('rollNo', roll);
      prefs.setString('hostel', hostel);
      prefs.setString('currMess', currSubscribedMess);
      prefs.setString('name', name);
      prefs.setString('userId', userId);
      await prefs.setString('roomNumber', roomNumber);
      await prefs.setString('phoneNumber', phoneNumber);
      await prefs.setBool('isSetupDone', isSetupDone);

      // Return the data as a map
      return {
        'name': name,
        'email': mail,
        'roll': roll,
      };
    } else if (resp.statusCode == 401) {
      debugPrint("Unauthorized access: Invalid token or session expired.");
      throw Exception('Unauthorized: Please log in again.');
    } else {
      debugPrint("Error occurred: ${resp.statusCode} - ${resp.reasonPhrase}");
      throw Exception('Failed to fetch user details.');
    }
  } catch (e) {
    debugPrint("error is: $e");
    rethrow;
  }
}

/// Fetch the user's profile picture (base64) from the backend and persist it in SharedPreferences
/// Backend endpoint should return JSON like { "base64": "..." } or { "base64": "" } on failure/no-image
Future<void> fetchUserProfilePicture() async {
  final header = await getAccessToken();
  final prefs = await SharedPreferences.getInstance();

  if (header == 'error') {
    // Not authenticated — clear any cached picture
    await prefs.setString('profilePicture', '');
    return;
  }

  try {
    final resp = await http.get(
      Uri.parse(ProfilePicture.getUserProfilePicture),
      headers: {
        "Authorization": "Bearer $header",
        "Content-Type": "application/json",
      },
    );

    if (resp.statusCode == 200) {
      final contentType = resp.headers['content-type'] ?? '';
      if (contentType.contains('application/json')) {
        // Server returned JSON (e.g., { url: ... } or { base64: ... })
        final Map<String, dynamic> data = json.decode(resp.body);
        // If server provides raw base64 string in `base64`, use it.
        if (data.containsKey('base64')) {
          final String b64 = (data['base64'] ?? '') as String;
          await prefs.setString('profilePicture', b64);
        } else if (data.containsKey('url')) {
          // Server returned a URL (this may be an org-scoped OneDrive link).
          // Try to fetch the URL server-side would be ideal; here we clear pref
          // so the app will show default. The backend should be updated to
          // return bytes instead of URL when possible.
          await prefs.setString('profilePicture', '');
        } else {
          await prefs.setString('profilePicture', '');
        }
      } else {
        // Server returned raw bytes (image). Convert to base64 and persist.
        final bytes = resp.bodyBytes;
        if (bytes.isNotEmpty) {
          final String b64 = base64Encode(bytes);
          await prefs.setString('profilePicture', b64);
        } else {
          await prefs.setString('profilePicture', '');
        }
      }
    } else {
      // On failure, ensure pref is empty so UI will show default
      await prefs.setString('profilePicture', '');
    }
  } catch (e) {
    // Any error — clear cached picture so app shows default
    await prefs.setString('profilePicture', '');
  }
}
