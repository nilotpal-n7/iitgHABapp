import 'package:flutter/material.dart';
import 'package:frontend2/utilities/notifications.dart';

class NotificationNotifier {
  // Delegate to the global notificationHistoryNotifier from notifications.dart
  static ValueNotifier<List<dynamic>> get notifier =>
      notificationHistoryNotifier;

  static void init() {
    // The notifications.dart file handles all initialization
    // This is just a compatibility wrapper
    print('✅ NotificationNotifier initialized (using global notifier)');
  }
}
