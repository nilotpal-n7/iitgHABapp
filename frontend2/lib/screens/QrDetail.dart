import 'package:flutter/material.dart';
import 'package:frontend1/widgets/common/hostel_details.dart';
import 'package:frontend1/screens/home_screen.dart';
import 'package:frontend1/widgets/common/hostel_name.dart';
import 'package:http/http.dart' as http;
import 'package:frontend1/apis/protected.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';



class QrDetail extends StatefulWidget {
  final Map<String, dynamic> itemData;

  const QrDetail({super.key, required this.itemData});

  @override
  State<QrDetail> createState() => _QrDetailState();
}

class _QrDetailState extends State<QrDetail> {
  final TextEditingController _complaintNameController = TextEditingController();
  final TextEditingController _complaintDescriptionController = TextEditingController();


  final _formKey = GlobalKey<FormState>(); // Key for form validation
  String complaintName = '';
  String complaintDescription = '';
  bool _isSubmitting = false; // For loading state

  // Function to submit the complaint to the backend


  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    // Extracting the relevant data from itemData

    String name = widget.itemData['name'] ?? 'N/A';
    String rollNumber = widget.itemData['rollNumber'] ?? 'Not Available';
    String currMess = widget.itemData['rollNumber'] ?? 'Not Available';
    String hostel = widget.itemData['hostel'] ?? 'N/A';

    return Scaffold(
      appBar: AppBar(title: Text('QR Details')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Current Mess is: ${calculateHostel(currMess)}' , style: TextStyle(fontSize: 20)),
              SizedBox(height: 8),
              Text('Name: $name', style: TextStyle(fontSize: 20)),
              SizedBox(height: 8),
              Text('Location: $rollNumber', style: TextStyle(fontSize: 16)),
              SizedBox(height: 8),
              Text('Hostel: ${calculateHostel(hostel)}', style: TextStyle(fontSize: 16)),
              Divider(height: 30),
              TextField(
                controller: _complaintNameController,
                decoration: InputDecoration(
                  labelText: 'Complaint Name',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: _complaintDescriptionController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Complaint Description',
                  border: OutlineInputBorder(),
                ),
              ),

            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _complaintNameController.dispose();
    _complaintDescriptionController.dispose();
    super.dispose();
  }
}