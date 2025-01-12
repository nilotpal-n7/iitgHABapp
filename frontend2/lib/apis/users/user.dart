import 'dart:convert';

import 'package:frontend1/apis/authentication/login.dart';
import 'package:hive/hive.dart';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:frontend1/constants/endpoint.dart';
import 'package:frontend1/apis/protected.dart';
import 'dart:io';


Future<Map<String, String>?> fetchUserDetails() async {
  final header = await getAccessToken();

  print("token is "+header);
  if (header == 'error') {
    throw ('token not found');
  }
  try {
    final resp = await http.get(
      Uri.parse(UserEndpoints.currentUser),
      headers: {
        "Authorization": "Bearer $header",//make sure to include Bearer
        "Content-Type": "application/json",
      },
    );
    print('Response headers: ${resp.headers}');

    if (resp.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      final Map<String, dynamic> userData = json.decode(resp.body);

      // Extract user details
      final String name = userData['name'];
      final String degree = userData['degree'];
      final String mail = userData['email'];
      prefs.setString('email', mail);
      final String roll = userData['rollNumber'];

      print("Name: $name");
      print("Degree: $degree");
      print("Email: $mail");
      print("Roll: $roll");

      // Return the data as a map
      return {
        'name': name,
        'email': mail,
        'roll': roll,
      };
    }else if ( resp.statusCode == 401) {
      print("Unauthorized access: Invalid token or session expired.");
      throw Exception('Unauthorized: Please log in again.');
    } else {
      print("Error occurred: ${resp.statusCode} - ${resp.reasonPhrase}");
      throw Exception('Failed to fetch user details.');
    }

  } catch (e) {
    print("error is: $e");
    rethrow;
  }
}

