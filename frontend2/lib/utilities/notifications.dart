import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/apis/protected.dart';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend2/models/notification_model.dart';

// ✅ Create a global instance of FlutterLocalNotificationsPlugin
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// ✅ Global variable to store SharedPreferences for notification history
SharedPreferences? _sharedPrefs;

// ✅ Global ValueNotifier for notification updates (can be listened to by UI)
final ValueNotifier<List<NotificationModel>> notificationHistoryNotifier =
    ValueNotifier<List<NotificationModel>>([]);

// ✅ Global ValueNotifier to trigger feedback card refresh
final ValueNotifier<bool> feedbackRefreshNotifier = ValueNotifier<bool>(false);

// ✅ Global ValueNotifier for tab navigation requests (0=Home, 1=Mess, 2=ComingSoon)
final ValueNotifier<int?> tabNavigationNotifier = ValueNotifier<int?>(null);

// ✅ Global ValueNotifier for deep navigation (for pushing screens like MessChangePreferenceScreen)
final ValueNotifier<String?> deepNavigationNotifier =
    ValueNotifier<String?>(null);

// ✅ Global navigator key reference (set from main.dart to avoid circular imports)
GlobalKey<NavigatorState>? globalNavigatorKey;

// ✅ Set the navigator key (called from main.dart)
void setNavigatorKey(GlobalKey<NavigatorState> key) {
  globalNavigatorKey = key;
}

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

// ✅ Helper function to save notification to SharedPreferences for history
Future<void> _saveNotificationToHistory(String title, String body,
    {String? redirectType}) async {
  try {
    _sharedPrefs ??= await SharedPreferences.getInstance();

    // Create notification model
    final notification = NotificationModel(
      title: title,
      body: body,
      redirectType: redirectType,
      timestamp: DateTime.now(),
    );

    // Load existing notifications
    List<NotificationModel> notifications = _loadNotificationsFromPrefs();
    notifications.add(notification);

    // Save as JSON
    final jsonList = notifications.map((n) => jsonEncode(n.toJson())).toList();
    await _sharedPrefs?.setStringList('notifications', jsonList);

    // Update the ValueNotifier to notify listeners
    notificationHistoryNotifier.value = notifications;
    print('✅ Saved notification to history: $title: $body');
  } catch (e) {
    print('❌ Error saving notification to history: $e');
  }
}

// ✅ Helper function to load notifications from SharedPreferences
List<NotificationModel> _loadNotificationsFromPrefs() {
  try {
    final jsonList = _sharedPrefs?.getStringList("notifications") ?? [];
    List<NotificationModel> notifications = [];

    for (var jsonString in jsonList) {
      try {
        final json = jsonDecode(jsonString);
        notifications.add(NotificationModel.fromJson(json));
      } catch (e) {
        // Try legacy string format
        try {
          notifications.add(NotificationModel.fromLegacyString(jsonString));
        } catch (_) {
          // Skip invalid entries
        }
      }
    }

    return notifications;
  } catch (e) {
    print('❌ Error loading notifications: $e');
    return [];
  }
}

// ✅ Background message handler (must be top-level function)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('💤 Handling background message: ${message.messageId}');
  print('💤 Message data: ${message.data}');
  if (message.notification != null) {
    print('💤 Message also contained a notification: ${message.notification}');
    final redirectType = message.data['redirectType'];
    await _saveNotificationToHistory(
      message.notification!.title ?? 'No Title',
      message.notification!.body ?? 'No Body',
      redirectType: redirectType,
    );
  }
}

// ✅ Initialize local notifications and message listeners
Future<void> initializeFcm() async {
  // Initialize local notifications
  const AndroidInitializationSettings androidInit =
      AndroidInitializationSettings('@mipmap/hab_icon');
  const InitializationSettings initSettings =
      InitializationSettings(android: androidInit);
  await flutterLocalNotificationsPlugin.initialize(initSettings);

  // Register background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize SharedPreferences for notification history
  _sharedPrefs = await SharedPreferences.getInstance();
  // Load existing notifications into the ValueNotifier
  notificationHistoryNotifier.value = _loadNotificationsFromPrefs();

  // ✅ Foreground message handler
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('📩 Foreground message received: ${message.messageId}');
    if (message.notification != null) {
      print(
          '📩 Notification: ${message.notification!.title} - ${message.notification!.body}');
      _showLocalNotification(message.notification!);
      // Save to notification history (this also updates the ValueNotifier)
      final redirectType = message.data['redirectType'];
      _saveNotificationToHistory(
        message.notification!.title ?? 'No Title',
        message.notification!.body ?? 'No Body',
        redirectType: redirectType,
      );
    }
  });

  // ✅ Notification tap handler (when app is opened via notification)
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('🚀 Notification opened: ${message.data}');
    if (message.notification != null) {
      final redirectType = message.data['redirectType'];
      _saveNotificationToHistory(
        message.notification!.title ?? 'No Title',
        message.notification!.body ?? 'No Body',
        redirectType: redirectType,
      );
    }
    // Handle navigation based on data
    _handleNotificationNavigation(message.data);
  });

  // Handle notification when app is opened from terminated state
  FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
    if (message != null && message.notification != null) {
      print('🔁 App opened from terminated via notification');
      final redirectType = message.data['redirectType'];
      _saveNotificationToHistory(
        message.notification!.title ?? 'No Title',
        message.notification!.body ?? 'No Body',
        redirectType: redirectType,
      );
      // Handle navigation based on data
      _handleNotificationNavigation(message.data);
    }
  });
}

// ✅ Helper function to handle notification navigation
void _handleNotificationNavigation(Map<String, dynamic> data) {
  if (data['redirectType'] == null) return;

  final redirectType = data['redirectType'] as String;
  print('📍 Handling redirect: $redirectType');

  // Map redirect types to tab indices
  int? targetTab;
  switch (redirectType) {
    case 'mess_screen':
      targetTab = 1; // Mess Screen tab
      feedbackRefreshNotifier.value = !feedbackRefreshNotifier.value;
      break;
    case 'mess_change':
      targetTab = 0; // Home Screen tab (Mess Change screen is in HomeScreen)
      deepNavigationNotifier.value = 'mess_change_screen';
      break;
    case 'profile':
      targetTab = 0; // Home Screen tab (Profile screen is in HomeScreen)
      deepNavigationNotifier.value = 'profile_screen';
      break;
    default:
      print('📍 Unknown redirect type: $redirectType');
      return;
  }

  // Trigger navigation to the appropriate tab
  tabNavigationNotifier.value = targetTab;
  print('📍 Navigated to tab: $targetTab');
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

// ✅ Helper function to get notification history from SharedPreferences
Future<List<NotificationModel>> getNotificationHistory() async {
  try {
    _sharedPrefs ??= await SharedPreferences.getInstance();
    return _loadNotificationsFromPrefs();
  } catch (e) {
    print('❌ Error getting notification history: $e');
    return [];
  }
}
