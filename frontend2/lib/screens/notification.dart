import 'package:flutter/material.dart';
import 'package:frontend2/providers/notifications.dart';
import 'package:frontend2/utilities/notification_card.dart';
import 'package:frontend2/utilities/Notifier.dart';
import 'package:frontend2/models/notification_model.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: NotificationNotifier.notifier,
      builder: (context, storedNotifications, child) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: DraggableScrollableSheet(
            initialChildSize: 0.85,
            minChildSize: 0.6,
            maxChildSize: 0.95,
            builder: (context, controller) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    // Header
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: Colors.blue[50],
                            child: const Icon(Icons.notifications_none,
                                color: Colors.blue, size: 27),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Notifications",
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(color: Colors.black, fontSize: 20),
                          ),
                        ],
                      ),
                    ),

                    // List of notifications
                    ValueListenableBuilder(
                      valueListenable:
                          NotificationProvider.notificationProvider,
                      builder: (context, storedNotifications, child) {
                        // Cast to List<NotificationModel>
                        final List<NotificationModel> notifications =
                            storedNotifications.map((item) {
                          if (item is NotificationModel) return item;
                          // Handle backward compatibility
                          return NotificationModel.fromLegacyString(
                              item.toString());
                        }).toList();

                        return Expanded(
                          child: notifications.isEmpty
                              ? const Center(
                                  child: Text(
                                    'No notifications yet.',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                )
                              : ListView.builder(
                                  controller: controller,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  itemCount: notifications.length,
                                  itemBuilder: (context, index) {
                                    final notif = notifications.reversed
                                        .toList()[index]; // recent first

                                    return Column(
                                      children: [
                                        NotificationCard(
                                          title: notif.title,
                                          subtitle: notif.body,
                                          description: notif.formattedDateTime,
                                          redirectType: notif.redirectType,
                                        ),
                                        const SizedBox(height: 12),
                                      ],
                                    );
                                  },
                                ),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
