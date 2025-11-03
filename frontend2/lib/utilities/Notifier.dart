// ignore_for_file: file_names

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:frontend2/utilities/notifications.dart';

/// Compatibility wrapper that exposes the global
/// `notificationHistoryNotifier` from `notifications.dart`.
class NotificationNotifier {
  // Delegate to the global notificationHistoryNotifier from notifications.dart
  static ValueNotifier<List<dynamic>> get notifier =>
      notificationHistoryNotifier;

  static void init() {
    // The notifications.dart file handles all initialization
    // This is just a compatibility wrapper
    debugPrint('✅ NotificationNotifier initialized (using global notifier)');
  }
}
