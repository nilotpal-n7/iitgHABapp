import 'package:flutter/material.dart';
import 'package:frontend1/screen1/qrdetails_gala.dart';
import 'package:frontend1/widgets/common/snack_bar.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:frontend1/utilities/permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend1/apis/protected.dart';
import 'package:dio/dio.dart';
import 'package:flutter_vibrate/flutter_vibrate.dart';
import 'package:frontend1/widgets/common/cornerQR.dart';
import 'package:frontend1/constants/endpoint.dart';

import '../../screen1/QrDetail.dart';

final dio = Dio();
class QrScan extends StatefulWidget {
  const QrScan({super.key});

  @override
  State<QrScan> createState() => _QrScanState();
}

class _QrScanState extends State<QrScan> {
  late MobileScannerController controller;
  bool _hasScanned = false; // Flag to track if a scan has been processed VERY IMP CONCEPT like this happens it scans twice maybe idk

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
    //final header = await getAccessToken();
    final url = "https://hab.codingclubiitg.in/api/qr/check";

    try {
      final response = await dio.put(
        url,
        data: jsonEncode({'qr_string': qrCode}), // Correctly using data
        options: Options(
          headers: {
            "Content-Type": "application/json",
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data; // No need to decode manually earlier in http we have to print that
      } else if (response.statusCode == 404) {
        showSnackBar('QR has been used once',context);
      } else {
        showSnackBar('Failed to load item. Status code: ${response.statusCode}',context);
      }
    } catch (e) {
      showSnackBar('Error: $e',context);
    }

    return null;
  }


  // Handle QR code detection
  void onBarcodeDetected(BarcodeCapture capture) async {
    if (_hasScanned) return; // Prevent further processing if already scanned
    _hasScanned = true; // Setting the flag to indicate processing has started

    try {
      final List<Barcode> barcodes = capture.barcodes;
      for (final barcode in barcodes) {
        final result = barcode.rawValue;
        if (result != null) {
          print('Barcode found: $result');
          controller.stop();

          // Fetch the item data using the serial number (barcode result)
          var itemData = await fetchItemBySerialNumber(result);
          if (itemData != null) {
            if (await Vibrate.canVibrate) {
              Vibrate.feedback(FeedbackType.success);
            }
            print("user details are $itemData");
            // Navigate to the details page with the fetched item data
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => DataScreen(itemData: itemData),// IMP: earlier we were passing data to QrDetail but now for some time we ll pass it to qrdetails_gaala
              ),
            );
          } else {
            print('Failed to fetch item data.');
          }
        } else {
          print('No QR code found.');
        }
      }
    } catch (e, stackTrace) {
      print('Error: $e');
      print(stackTrace);
    }

  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('QR Scanner')),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: onBarcodeDetected,
          ),
          Center(
            child: CustomPaint(
              size: Size(250, 250),
              painter: CornerPainter(),
            ),
          ),
        ],
      ),
    );
  }
}