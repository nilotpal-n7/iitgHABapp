import 'dart:convert';

import 'package:frontend/database/hive_store.dart';
import 'package:frontend/apis/authentication/login.dart';
import 'package:hive/hive.dart';
import 'package:frontend/widgets/profile_screen/brach_name.dart';
import 'package:http/http.dart' as http;
import 'package:frontend/apis/protected.dart';
import 'package:frontend/constants/endpoints.dart';





Future<void> fetchUserDetails() async {
  final accessToken = await getAccessToken();

  final response = await http.get(
    Uri.parse(Userendpoints.getdetails),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    final Map<String, dynamic> userData = json.decode(response.body);
    print("Name: ${userData['displayName']}");
    print("Email: ${userData['mail']}");
    final ID = userData['surname'];
    print("Roll: $ID");
    final branch  = calculateBranch(ID);
    print("Branch: $branch");



  } else {
    print("Failed to fetch user details: ${response.statusCode}");
  }



}
