import 'package:flutter/material.dart';
import 'package:frontend2/screens/scan_status.dart';
import 'package:frontend2/screens/initial_setup_screen.dart';
import 'package:frontend2/widgets/common/snack_bar.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:dio/dio.dart';
import 'package:vibration/vibration.dart';
import 'package:frontend2/widgets/common/cornerQR.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/widgets/microsoft_required_dialog.dart';

final dio = Dio();

class QrScan extends StatefulWidget {
  const QrScan({super.key});

  @override
  State<QrScan> createState() => _QrScanState();
}

class _QrScanState extends State<QrScan> {
  late MobileScannerController controller;
  bool _hasScanned = false;
  bool _isProcessing = false;
  bool _cameraPermissionGranted = false;
  bool _profilePicMissing = false;

  @override
  void initState() {
    super.initState();
    _checkMicrosoftLink();
    controller = MobileScannerController();
    _checkProfilePic();
    _checkPermission();
  }

  Future<void> _checkMicrosoftLink() async {
    final prefs = await SharedPreferences.getInstance();
    final hasMicrosoftLinked = prefs.getBool('hasMicrosoftLinked') ?? false;

    if (!hasMicrosoftLinked && mounted) {
      // Show dialog to link Microsoft account
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (context) => const MicrosoftRequiredDialog(
              featureName: 'QR Code Scanning',
            ),
          );
          // Navigate back
          Navigator.pop(context);
        }
      });
      return;
    }
  }

  void _checkProfilePic() {
    if (ProfilePictureProvider.profilePictureString.value.isEmpty) {
      setState(() {
        _profilePicMissing = true;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showProfilePicDialog();
      });
    }
  }

  void _showProfilePicDialog() {
    final navigator = Navigator.of(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return PopScope(
          canPop: false,
          child: Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            backgroundColor: const Color(0xFF1E1E2C),
            child: Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person_off_rounded,
                      color: Colors.redAccent,
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Profile Picture Required',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'You need to upload a profile picture to scan mess QR',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.redAccent,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _profilePicMissing = false; // Allow pop temporarily
                        });
                        Navigator.of(dialogContext).pop(); // Close dialog
                        navigator.pop(); // Go back to previous screen
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4C4EDB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Go Back',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _checkPermission() async {
    var status = await Permission.camera.status;
    if (status.isGranted) {
      setState(() => _cameraPermissionGranted = true);
      controller.start();
    } else {
      var result = await Permission.camera.request();
      if (result.isGranted) {
        setState(() => _cameraPermissionGranted = true);
        controller.start();
      } else {
        setState(() => _cameraPermissionGranted = false);
      }
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> scanMess(String messID) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    // capture navigator early to avoid using BuildContext after awaits
    final navigator = Navigator.of(context);

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('userId');
      final accessToken = prefs.getString('access_token');

      // Ensure widget is still mounted before using the BuildContext
      if (!mounted) return;

      if (userId == null) {
        showSnackBar('User not logged in', Colors.red, context);
        return;
      }

      final url = "$baseUrl/mess/scan/$messID";

      final response = await dio.post(
        url,
        data: {
          'userId': userId,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $accessToken',
            'Content-Type': 'application/json',
          },
        ),
      );

      final hasVib = await Vibration.hasVibrator();
      if (hasVib == true) {
        Vibration.vibrate(duration: 100);
      }

      if (!mounted) return;

      navigator
          .push(
        MaterialPageRoute(
          builder: (context) => ScanStatusPage(response: response),
        ),
      )
          .then((_) {
        setState(() {
          _hasScanned = false;
          _isProcessing = false;
        });
        controller.start();
      });
    } catch (e) {
      String errorMessage = 'Unknown error';
      if (e is DioException) {
        if (e.response != null && e.response?.data != null) {
          final data = e.response?.data;
          errorMessage = data['message'] ?? 'Server error';
        } else {
          errorMessage = e.message ?? 'Network error';
        }
      } else {
        errorMessage = e.toString();
      }

      if (!mounted) return;

      navigator
          .push(
        MaterialPageRoute(
          builder: (context) => ScanStatusPage(
            response: Response(
              requestOptions: RequestOptions(path: ''),
              statusCode: 500,
              data: {'message': errorMessage},
            ),
          ),
        ),
      )
          .then((_) {
        setState(() {
          _hasScanned = false;
          _isProcessing = false;
        });
        controller.start();
      });
    }
  }

  void onBarcodeDetected(BarcodeCapture capture) {
    if (_hasScanned || _isProcessing) return;

    setState(() {
      _hasScanned = true;
    });

    for (final barcode in capture.barcodes) {
      final result = barcode.rawValue;
      if (result != null) {
        controller.stop();
        scanMess(result);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_profilePicMissing,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _profilePicMissing) {
          // Show the dialog again if they try to dismiss it
          _showProfilePicDialog();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text('Mess Scanner'),
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (!_profilePicMissing) {
                Navigator.of(context).pop();
              } else {
                _showProfilePicDialog();
              }
            },
          ),
        ),
        body: _profilePicMissing
            ? Container(
                color: Colors.black,
                child: const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF4C4EDB),
                  ),
                ),
              )
            : !_cameraPermissionGranted
                ? _buildPermissionOverlay()
                : Stack(
                    children: [
                      MobileScanner(
                        controller: controller,
                        onDetect: onBarcodeDetected,
                      ),
                      _buildScannerUI(),
                      if (_isProcessing)
                        Container(
                          color: Colors.black54,
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFF4C4EDB),
                            ),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildPermissionOverlay() {
    return Container(
      color: Colors.black,
      child: Center(
        child: ElevatedButton(
          onPressed: _checkPermission,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4C4EDB),
            foregroundColor: Colors.white,
          ),
          child: const Text('Grant Camera Access'),
        ),
      ),
    );
  }

  Widget _buildScannerUI() {
    return Column(
      children: [
        const SizedBox(height: 80),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 40),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Ready to Eat?',
                    style: TextStyle(
                      color: Color.fromRGBO(255, 255, 255, 0.7),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    ' Scan',
                    style: TextStyle(
                      color: Color(0xFF4C4EDB),
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Text(
                'to Enter',
                style: TextStyle(
                  color: Color(0xFF4C4EDB),
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),
        Center(
          child: SizedBox(
            width: 250,
            height: 250,
            child: CustomPaint(
              size: const Size(250, 250),
              painter: CornerPainter(),
            ),
          ),
        ),
        const SizedBox(height: 40),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Hold your QR code steady within the frame',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}
