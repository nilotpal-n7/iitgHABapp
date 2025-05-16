import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:frontend1/constants/endpoint.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../apis/protected.dart';
import '../../providers/feedback_provider.dart';

class CommentPage extends StatefulWidget {
  @override
  State<CommentPage> createState() => _CommentPageState();
}

class _CommentPageState extends State<CommentPage> {
  final TextEditingController commentController = TextEditingController();
  // String? name;
  // String? roll;

  // Future<void> getUserInfoFromPrefs() async {
  //   final prefs = await SharedPreferences.getInstance();
  //
  //   setState(() {
  //     name = prefs.getString('name');
  //     roll = prefs.getString('rollNumber');
  //     print('name: $name');
  //     print('roll: $roll');
  //   });
  // }

  Future<void> submitFeedback(BuildContext context) async {
    final provider = Provider.of<FeedbackProvider>(context, listen: false);
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('name');
    final roll = prefs.getString('rollNumber');
    final token = await getAccessToken();
    print("access token-$token");
    print('name: $name');
    print('roll: $roll');
    print('breakfast: ${provider.breakfast}');
    print('lunch: ${provider.lunch}');
    print('dinner: ${provider.dinner}');
    print('comment: ${provider.comment}');

    if (token == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Access token not found. Please login again.')),
      );
      return;
    }

    final url = Uri.parse(messFeedback.feedbackSubmit);
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'name': name,
        'rollNumber': roll,
        'breakfast': provider.breakfast,
        'lunch': provider.lunch,
        'dinner': provider.dinner,
        'comment': provider.comment,
      }),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Feedback submitted successfully')),
      );
      provider.clear();
      Navigator.popUntil(context, (route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${response.body}')),
      );
    }
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<FeedbackProvider>(context);

    return Scaffold(
      appBar: AppBar(title: Text("Mess Feedback"), leading: BackButton()),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            LinearProgressIndicator(value: 1, color: Colors.deepPurple),
            SizedBox(height: 16),
            Text("Step 2 / 2", style: TextStyle(color: Colors.deepPurple)),
            SizedBox(height: 8),
            Text(
                "Add additional comments that would help improve the mess service"),
            SizedBox(height: 10),
            TextField(
              controller: commentController,
              maxLines: 5,
              maxLength: 100,
              decoration: InputDecoration(
                hintText: "Write in less than 100 words",
                border: OutlineInputBorder(),
              ),
              onChanged: provider.setComment,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => submitFeedback(context),
              child: Text("Submit"),
              style:
                  ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),
            )
          ],
        ),
      ),
    );
  }
}
