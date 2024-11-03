import 'package:permission_handler/permission_handler.dart';

class PermissionHandler {
  Future<void> requestCameraPermission(Function onGranted) async {
    var status = await Permission.camera.status;
    if (!status.isGranted) {
      // Request permission if not granted
      status = await Permission.camera.request();

      if (status.isGranted) {
        onGranted(); // Start the camera if permission is granted
      } else if (status.isDenied) {
        print("Camera permission denied");
      } else if (status.isPermanentlyDenied) {
        print("Camera permission permanently denied");
        openAppSettings();
      }
    } else {
      onGranted(); // Start the camera immediately if permission is already granted
    }
  }
}
