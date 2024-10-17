import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';

class permission {
  Future<void> requestCameraPermission() async {
    var status = await Permission.camera.status;
    if (!status.isGranted) {
      // If the camera permission is not granted, request it
      status = await Permission.camera.request();
      if (status.isGranted) {
        print("Camera permission granted");
      } else if (status.isDenied) {
        // Handle permission denial
        print("Camera permission denied");
      } else if (status.isPermanentlyDenied) {
        // Handle permanent denial (open settings)
        print("Camera permission permanently denied");
        openAppSettings();
      }
    }
  }

}



