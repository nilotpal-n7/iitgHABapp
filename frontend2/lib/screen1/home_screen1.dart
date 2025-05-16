import 'package:flutter/material.dart';
import 'package:frontend1/screen1/qr_scanner.dart';

class homescreen1 extends StatelessWidget {
  const homescreen1({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        // You can replace this with your actual UI for mess officials
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const QrScanner(),
              ),
            );
          },
          child: const Text("Open QR Scanner"),
        ),
      ),
    );
  }
}
