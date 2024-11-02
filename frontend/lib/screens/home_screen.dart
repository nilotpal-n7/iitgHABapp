import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend/apis/scan/qrcode.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    fetchComplaints(); // Fetch complaints when the page is opened
  }

  void fetchComplaints() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString('email'); // Retrieve email
    final token = prefs.getString('access_token'); // Retrieve JWT token

    if (email == null || token == null) {
      print('Email or token is null');
      return; // Handle the case when email or token is not found
    }
    print(token);

    final url = 'https://iitgcomplaintapp.onrender.com/api/users/complaints/$email';

    try {
      print('Fetching complaints...');
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',// Set the Authorization header
        },
      );

      if (response.statusCode == 200) {
        // If the server returns an OK response, parse the complaints
        final complaints = json.decode(response.body);
        print('Complaints fetched successfully: $complaints');
        // Handle the complaints data as needed
      } else {
        print('Failed to load complaints: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching complaints: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const QrScan()),
                );
              },
              child: const Text('Scan QR Code'),
            ),
          ],
        ),
      ),
    );
  }
}
