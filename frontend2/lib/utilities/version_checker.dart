import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:frontend2/constants/endpoint.dart';

class VersionChecker {
  static String? _appVersion;
  static String? _buildNumber;
  static String? _deviceType;
  static bool _updateRequired = false;
  static String? _storeUrl;
  static String? _updateMessage;

  static String getDeviceType() {
    if (kIsWeb) {
      return 'Web';
    } else if (Platform.isAndroid) {
      return 'Android';
    } else if (Platform.isIOS) {
      return 'iOS';
    } else if (Platform.isMacOS) {
      return 'macOS';
    } else if (Platform.isWindows) {
      return 'Windows';
    } else if (Platform.isLinux) {
      return 'Linux';
    } else {
      return 'Unknown';
    }
  }

  static Future<void> init() async {
    _deviceType = getDeviceType();
    
    // Get app version info
    final packageInfo = await PackageInfo.fromPlatform();
    _appVersion = packageInfo.version;
    _buildNumber = packageInfo.buildNumber;

    debugPrint('======================================');
    debugPrint('Device Type: $_deviceType');
    debugPrint('App Version: $_appVersion');
    debugPrint('Build Number: $_buildNumber');
    debugPrint('======================================');
  }

  /// Check version against server and return true if update is required
  static Future<bool> checkForUpdate() async {
    try {
      if (_deviceType != 'Android' && _deviceType != 'iOS') {
        debugPrint('Version check skipped: Not a mobile platform');
        return false;
      }

      final dio = Dio();
      final endpoint = _deviceType == 'Android'
          ? AppVersionEndpoints.getAndroidVersion
          : AppVersionEndpoints.getIosVersion;

      debugPrint('Checking version at: $endpoint');

      final response = await dio.get(endpoint);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final minVersion = data['minVersion'] as String;
        final forceUpdate = data['forceUpdate'] as bool;
        _storeUrl = data['storeUrl'] as String?;
        _updateMessage = data['updateMessage'] as String?;

        debugPrint('Server min version: $minVersion');
        debugPrint('Current app version: $_appVersion');
        debugPrint('Force update: $forceUpdate');

        if (forceUpdate && _isVersionLower(_appVersion!, minVersion)) {
          _updateRequired = true;
          debugPrint('Update required!');
          return true;
        }
      }

      return false;
    } catch (e) {
      debugPrint('Version check failed: $e');
      // Don't block app if version check fails
      return false;
    }
  }

  /// Compare versions: returns true if current < required
  static bool _isVersionLower(String current, String required) {
    try {
      final currentParts = current.split('.').map(int.parse).toList();
      final requiredParts = required.split('.').map(int.parse).toList();

      // Pad with zeros if needed
      while (currentParts.length < 3) currentParts.add(0);
      while (requiredParts.length < 3) requiredParts.add(0);

      for (int i = 0; i < 3; i++) {
        if (currentParts[i] < requiredParts[i]) return true;
        if (currentParts[i] > requiredParts[i]) return false;
      }

      return false; // Versions are equal
    } catch (e) {
      debugPrint('Version comparison error: $e');
      return false;
    }
  }

  /// Show update required dialog
  static Future<void> showUpdateDialog(BuildContext context) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return PopScope(
          canPop: false,
          child: Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            backgroundColor: Colors.white,
            elevation: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Update icon
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F4FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.system_update_alt_rounded,
                      color: Color(0xFF4C4EDB),
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Title
                  const Text(
                    'Update Available',
                    style: TextStyle(
                      color: Color(0xFF1A1A2E),
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Message
                  Text(
                    _updateMessage ?? 
                        'A new version of the app is available. Please update to continue using the app.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Version info
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Current version: $_appVersion',
                      style: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  
                  // Update button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _openStore(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4C4EDB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _deviceType == 'Android'
                                ? Icons.play_arrow_rounded
                                : Icons.apple_rounded,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _deviceType == 'Android'
                                ? 'Update Now'
                                : 'Update Now',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
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

  /// Open store URL
  static Future<void> _openStore() async {
    if (_storeUrl != null) {
      final uri = Uri.parse(_storeUrl!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  // Getters for accessing version info elsewhere
  static String get appVersion => _appVersion ?? 'Unknown';
  static String get buildNumber => _buildNumber ?? 'Unknown';
  static String get deviceType => _deviceType ?? 'Unknown';
  static String get fullVersion => '$appVersion+$buildNumber';
  static bool get updateRequired => _updateRequired;
  static String? get storeUrl => _storeUrl;
}
