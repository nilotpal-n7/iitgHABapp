import 'package:flutter/material.dart';
import 'package:frontend/screens/home_screen.dart';

class QrDetail extends StatefulWidget {
  final Map<String, dynamic> itemData;

  const QrDetail({super.key, required this.itemData});

  @override
  State<QrDetail> createState() => _QrDetailState();
}

class _QrDetailState extends State<QrDetail> {
  final TextEditingController _complaintNameController = TextEditingController();
  final TextEditingController _complaintDescriptionController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    // Extracting the relevant data from itemData
    String qrCode = widget.itemData['qrCode'] ?? 'N/A';
    String name = widget.itemData['name'] ?? 'N/A';
    String location = widget.itemData['location'] ?? 'N/A';
    List<dynamic> complaints = widget.itemData['complaints'] ?? [];
    String hostel = widget.itemData['hostel'] ?? 'N/A';

    return Scaffold(
      appBar: AppBar(title: Text('QR Details')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('QR Code: $qrCode', style: TextStyle(fontSize: 20)),
              SizedBox(height: 8),
              Text('Name: $name', style: TextStyle(fontSize: 20)),
              SizedBox(height: 8),
              Text('Location: $location', style: TextStyle(fontSize: 16)),
              SizedBox(height: 8),
              Text('Complaints: ${complaints.length}', style: TextStyle(fontSize: 16)),
              SizedBox(height: 8),
              Text('Hostel: $hostel', style: TextStyle(fontSize: 16)),
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

              SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  // Handle the complaint submission here
                  String complaintName = _complaintNameController.text;
                  String complaintDescription = _complaintDescriptionController.text;

                  // Add logic to save or send the complaint details
                  print('Complaint Name: $complaintName');
                  print('Complaint Description: $complaintDescription');

                  // Clear the fields after submission
                  _complaintNameController.clear();
                  _complaintDescriptionController.clear();

                  // Show a snackbar indicating success
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Complaint Submitted')),
                  );

                  // Navigate to the home page using MaterialPageRoute
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => HomeScreen()),
                  );
                },
                child: Text('Submit Complaint'),
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