import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:frontend/utilities/permissionhandle/handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend/screens/home_screen.dart';
import 'package:frontend/apis/protected.dart';
import 'package:frontend/screens/new_complaint_screen.dart';
import 'package:frontend/constants/endpoints.dart';

class QrScan extends StatefulWidget {
  const QrScan({super.key});

  @override
  State<QrScan> createState() => _QrScanState();
}

class _QrScanState extends State<QrScan> {
  late MobileScannerController controller;


  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
    permission().requestCameraPermission();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
  // Fetch the item data based on the scanned QR code and pass it to backend
  Future<void> fetchItemBySerialNumber(String qrCode) async {
    final header = await getAccessToken(); // Ensure you get the token properly
    final url = Uri.parse('${itemEndpoint.getitem}${qrCode}');

    try {
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer $header", // Include Bearer token
          "Content-Type": "application/json",
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        print(data); // You can now use the fetched data in your Flutter app
      } else if (response.statusCode == 404) {
        print('Item not found');
      } else {
        print('Failed to load item. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error: $e');
    }
  }

  // Handle QR code detection
  void onBarcodeDetected(BarcodeCapture capture) async {
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final result = await barcode.rawValue;
      if (result != null) {
        print('Barcode found: $result');
        controller.stop();
        await fetchItemBySerialNumber(result);
        Navigator.push(
            context,
            MaterialPageRoute(
            builder: (context) => HomeScreen(),
    ),
        );
      } else{
        print('no qr code');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('QR Scanner')),
      body: MobileScanner(
        controller: controller,
        onDetect: onBarcodeDetected,

        // Call the onBarcodeDetected method on QR scan
      ),
    );
  }
}





