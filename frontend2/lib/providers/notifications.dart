import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/cupertino.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationProvider {
  static var notificationProvider = ValueNotifier([]);
  static var notifications = <String>[];
  static void init() {
    SharedPreferences.getInstance().then((prefs) {
      notifications = prefs.getStringList('notifications') ?? [];
      // Firebase Messaging setup
      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
          print('📩 Foreground Notification');
          String? title = message.notification?.title ?? 'No Title';
          String? body = message.notification?.body ?? 'No Body';

          notifications.add('$title: $body');
          prefs.setStringList('notifications', notifications);
          notificationProvider.value = notifications;
          // setState(() {
          //   storedNotifications = prefs.getStringList('notifications') ?? [];
          //   //storedNotifications = stored;
          // });
        });
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          print('📩 Background Notification');
          String? title = message.notification?.title ?? 'No Title';
          String? body = message.notification?.body ?? 'No Body';

          notifications.add('$title: $body');
          prefs.setStringList('notifications', notifications);
          notificationProvider.value = notifications;
          // setState(() {
          //   storedNotifications = prefs.getStringList('notifications') ?? [];
          //   //storedNotifications = stored;
          // });
        });
        FirebaseMessaging.instance.getInitialMessage().then((message) {
          print('🔁 App opened from terminated via notification');
          String? title = message?.notification?.title ?? 'No Title';
          String? body = message?.notification?.body ?? 'No Body';

          notifications.add('$title: $body');
          prefs.setStringList('notifications', notifications);
          notificationProvider.value = notifications;
        });
    });
  }
}