import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MessCard extends StatefulWidget {
  const MessCard({super.key});

  @override
  State<MessCard> createState() => _MessCardState();
}

class _MessCardState extends State<MessCard> {
  String rollNumber = '';

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    getRoll();
  }

  Future<void> getRoll() async {
    final prefs = await SharedPreferences.getInstance();
    String storedRoll = prefs.getString('rollNumber') ?? "Not available";

    setState(() {
      rollNumber = storedRoll;
    });
  }

  @override
  Widget build(BuildContext context) {
    //here we are using roll Number as a QRcode for getting details in frontend
    String url = rollNumber;

    return Scaffold(
      appBar: AppBar(title: const Text("QR Code")),
      body: Center(
        child: rollNumber.isEmpty
            ? const CircularProgressIndicator() // Show loading indicator while fetching data
            : QrImageView(
                data: url, // QR Code contains the GET request URL
                version: QrVersions.auto,
                size: 400.0,
              ),
      ),
    );
  }
}
