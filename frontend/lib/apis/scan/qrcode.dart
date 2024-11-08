import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:frontend/utilities/permissionhandle/handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend/apis/protected.dart';
import 'package:flutter_vibrate/flutter_vibrate.dart';
import 'package:frontend/widgets/common/cornerQR.dart';
import 'package:frontend/constants/endpoints.dart';
import '../../screens/qr_detail.dart';

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

    // Request permission and start the camera if granted
    PermissionHandler().requestCameraPermission(() {
      controller.start();
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }


  Future<Map<String, dynamic>?> fetchItemBySerialNumber(String qrCode) async {
    final header = await getAccessToken();
    final url = Uri.parse('${itemEndpoint.getitem}$qrCode');

    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $header", // Pass token if required
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        return data; // Return the fetched data
      } else if (response.statusCode == 404) {
        print('Item not found');
      } else {
        print('Failed to load item. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error: $e');
    }
    return null;
  }

  // Handle QR code detection
  void onBarcodeDetected(BarcodeCapture capture) async {
    final List<Barcode> barcodes = capture.barcodes;
    controller.stop();
    for (final barcode in barcodes) {
      final result = barcode.rawValue;
      if (result != null) {
        print('Barcode found: $result');
        // Stop the scanner after a successful scan, but only after processing this barcode

        // Provide feedback using vibration

        try {
          // Fetch the item data using the serial number (barcode result)
          var itemData = await fetchItemBySerialNumber(result);
          if (itemData != null) {
            if (await Vibrate.canVibrate) {
              Vibrate.feedback(FeedbackType.success);
            }
            // Navigate to the details page with the fetched item data
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => QrDetail(itemData: itemData), // Pass the item data
              ),
            );
          } else {
            print('Failed to fetch item data.');
          }
        } catch (e) {
          // Handle any errors that might occur during fetch
          print('Error fetching item data: $e');
        }
      } else {
        print('No QR code found.');
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('QR Scanner')),
      body: Stack(
        children: [ MobileScanner(
          controller: controller,
          onDetect: onBarcodeDetected, // Call the onBarcodeDetected method on QR scan
        ),
          Center(
            child: CustomPaint(
              size: Size(250,250),
              painter: CornerPainter(),
            )
          ),
      ],
      ),
    );
  }
}
