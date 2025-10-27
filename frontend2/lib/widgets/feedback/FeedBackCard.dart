import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants/endpoint.dart';
import '../../screens/mess_feedback/mess_feedback_page.dart';

class FeedbackCard extends StatefulWidget {
  @override
  State<FeedbackCard> createState() => _FeedbackCardState();
}

class _FeedbackCardState extends State<FeedbackCard> {
  bool _submitted = false;
  bool _windowOpen = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _checkFeedbackStatus();
  }

  Future<void> _checkFeedbackStatus() async {
    try {
      final dio = Dio();

      // Check if feedback window is open
      final settingsRes = await dio.get(messFeedback.feedbackSettings);
      final windowOpen = settingsRes.data['isEnabled'] == true;

      if (windowOpen) {
        // Get auth token
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');

        if (token != null) {
          // Check if user has already submitted feedback
          final submittedRes = await dio.get(
            messFeedback.feedbackSubmitted,
            options: Options(
              headers: {"Authorization": "Bearer $token"},
            ),
          );
          setState(() {
            _submitted = submittedRes.data['submitted'] == true;
            _windowOpen = true;
            _loading = false;
          });
        } else {
          setState(() {
            _submitted = false;
            _windowOpen = true;
            _loading = false;
          });
        }
      } else {
        setState(() {
          _submitted = false;
          _windowOpen = false;
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _submitted = false;
        _windowOpen = false;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Don't show the card if feedback window is closed
    if (!_windowOpen) {
      return SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How did the mess do this month?',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text("You can help the mess team serve better meals.",
              style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 8),
          const Row(
            children: [
              Icon(Icons.access_time, color: Colors.red, size: 18),
              SizedBox(width: 4),
              Text('Form closes in 2 Days',
                  style: TextStyle(
                      color: Colors.red, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 12),
          _loading
              ? Center(child: CircularProgressIndicator())
              : SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          _submitted ? Colors.grey : const Color(0xFF3754DB),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24)),
                    ),
                    onPressed: _submitted
                        ? null
                        : () {
                            setState(() {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => MessFeedbackPage(),
                                ),
                              );
                            });
                          },
                    child: Text(
                      _submitted
                          ? 'You have already filled the feedback for this time'
                          : 'Give feedback',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}
