import 'package:flutter/material.dart';
import 'package:frontend/apis/scan/qrcode.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: (){
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => QrScan()),  // Navigate to the QR scanner screen
                );
              },
              child: Text('Scan QR Code'),
            ),
          ],
        ),

      ),

      );
  }
}