import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend/screens/ComplaintDetails.dart';
import 'package:frontend/apis/scan/qrcode.dart';
// Import the new screen

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? email;
  String? token;
  List<dynamic> complaints = []; // List to hold complaints

  @override
  void initState() {
    super.initState();
    fetchComplaints(); // Fetch complaints when the page is opened
  }

  void fetchComplaints() async {
    final prefs = await SharedPreferences.getInstance();
    email = prefs.getString('email'); // Retrieve email
    token = prefs.getString('access_token'); // Retrieve JWT token

    if (email == null || token == null) {
      print('Email or token is null');
      return; // Handle the case when email or token is not found
    }

    final url = 'http://192.168.195.85:3000/api/users/complaints/$email';

    try {
      print('Fetching complaints...');
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        complaints = data['complaints'] ?? []; // Extract complaints from the response
        print('Complaints fetched: $complaints');
        setState(() {}); // Update the UI
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
      appBar: AppBar(
        title: Text('Home Screen'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(height: 20),
            Expanded(
              child: complaints.isEmpty
                  ? Center(
                child: Text(
                  'No complaints yet. Use the plus button to add a complaint.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                ),
              )
                  : ListView.builder(
                itemCount: complaints.length,
                itemBuilder: (context, index) {
                  final complaint = complaints[index];

                  return GestureDetector(
                    onTap: () {
                      // Navigate to the ComplaintDetailScreen when tapped
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ComplaintDetailScreen(
                            id: complaint['_id'], // Pass the complaint ID
                            description: complaint['description'] ?? 'No description',
                            status: complaint['status'] ?? 'Unknown',
                            createdOn: complaint['createdOn']?.toString() ?? '',
                          ),
                        ),
                      );
                    },
                    child: Container(
                      margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.2),
                            spreadRadius: 2,
                            blurRadius: 5,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            complaint['description'] ?? 'No description',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Status: ${complaint['status']}',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Created On: ${complaint['createdOn']?.toString() ?? ''}',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => QrScan(),
            ),
          );
        },
        backgroundColor: Colors.deepPurple,
        child: Icon(Icons.add),
      ),
    );
  }
}
