import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/apis/protected.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';

// ✅ Create a global instance of FlutterLocalNotificationsPlugin
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// ✅ Create and register a high-importance channel (for heads-up pop-down)
const AndroidNotificationChannel highImportanceChannel =
    AndroidNotificationChannel(
  'high_importance_channel', // must match manifest value
  'High Importance Notifications',
  description: 'Used for important heads-up notifications.',
  importance: Importance.max,
  playSound: true,
);

Future<void> setupNotificationChannel() async {
  final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
      flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();

  await androidImplementation?.createNotificationChannel(highImportanceChannel);
}

// ✅ Background message handler (must be top-level function)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('💤 Handling background message: ${message.messageId}');
  print('💤 Message data: ${message.data}');
  if (message.notification != null) {
    print('💤 Message also contained a notification: ${message.notification}');
  }
}

// ✅ Initialize local notifications and message listeners
Future<void> initializeFcm() async {
  // Initialize local notifications
  const AndroidInitializationSettings androidInit =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initSettings =
      InitializationSettings(android: androidInit);
  await flutterLocalNotificationsPlugin.initialize(initSettings);

  // Register background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // ✅ Foreground message handler
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('📩 Foreground message received: ${message.messageId}');
    if (message.notification != null) {
      print(
          '📩 Notification: ${message.notification!.title} - ${message.notification!.body}');
      _showLocalNotification(message.notification!);
    }
  });

  // ✅ Notification tap handler (when app is opened via notification)
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('🚀 Notification opened: ${message.data}');
    // You can navigate the user to a specific screen using Navigator here
  });
}

// ✅ Helper function to display local notification in foreground
void _showLocalNotification(RemoteNotification notification) {
  const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    'high_importance_channel', // ✅ match manifest + setupNotificationChannel()
    'High Importance Notifications',
    importance: Importance.max,
    priority: Priority.high,
    playSound: true,
  );

  const NotificationDetails notificationDetails =
      NotificationDetails(android: androidDetails);

  flutterLocalNotificationsPlugin.show(
    0,
    notification.title,
    notification.body,
    notificationDetails,
  );
}

// ✅ Registers or updates the device FCM token on your backend
Future<void> registerFcmToken() async {
  try {
    final header = await getAccessToken();
    print('Access token: 😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊');
    print('1');

    String? token = await FirebaseMessaging.instance.getToken();
    if (token == null) {
      print('❌ No FCM token received');
      return;
    }

    final dio = Dio();
    print('2');
    print('Header Token: $header');
    print('Uri: ${Uri.parse(NotificationEndpoints.registerToken)}');

    // ✅ Listen for token refresh events and re-register
    FirebaseMessaging.instance.onTokenRefresh.listen((fcmToken) async {
      final res = await dio.post(
        NotificationEndpoints.registerToken,
        options: Options(
          headers: {
            'Authorization': 'Bearer $header',
            'Content-Type': 'application/json',
          },
        ),
        data: jsonEncode({'fcmToken': fcmToken}), // ✅ Use fcmToken here
      );
      if (res.statusCode == 200) {
        print('🔄 FCM token re-registered: $fcmToken');
      } else {
        print('❌ Failed to re-register token');
      }
    }).onError((err) {
      print('❌ Failed to re-register token: $err');
    });

    // ✅ Register the current token
    final res = await dio.post(
      NotificationEndpoints.registerToken,
      options: Options(
        headers: {
          'Authorization': 'Bearer $header',
          'Content-Type': 'application/json',
        },
      ),
      data: jsonEncode({'fcmToken': token}),
    );

    print('3');
    if (res.statusCode == 200) {
      print('✅ FCM token registered: $token');
    } else {
      print('❌ Failed to register token');
    }
  } catch (e) {
    print('4');
    print('❌ Error registering FCM token: $e');
  }
}

// ✅ Request notification permission and initialize listeners
Future<void> listenNotifications() async {
  await setupNotificationChannel();
  await FirebaseMessaging.instance.requestPermission();
  await initializeFcm(); // Initialize handlers after permission granted
  print('✅ Notification listeners initialized');
}

