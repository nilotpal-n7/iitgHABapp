import 'package:flutter/material.dart';
import 'package:frontend2/utilities/notifications.dart';

class NotificationCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String description;
  final String? redirectType;

  const NotificationCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.description,
    this.redirectType,
  });

  void _handleTap(BuildContext context) {
    // Navigate based on redirect type
    if (redirectType == null) return;

    switch (redirectType) {
      case 'mess_screen':
        // Switch to Mess tab (index 1)
        tabNavigationNotifier.value = 1;
        feedbackRefreshNotifier.value = !feedbackRefreshNotifier.value;
        break;
      case 'mess_change':
        // Navigate to Mess Change screen
        tabNavigationNotifier.value = 0;
        deepNavigationNotifier.value = 'mess_change_screen';
        break;
      case 'profile':
        // Navigate to Profile screen
        tabNavigationNotifier.value = 0;
        deepNavigationNotifier.value = 'profile_screen';
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title and date/time
            Row(children: [
              Expanded(
                child: Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(color: Colors.grey[600], fontSize: 14)),
              ),
            ]),
            Divider(color: Colors.grey[300], height: 16),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(color: Colors.grey[700])),
            const SizedBox(height: 4),
            Text(
              description,
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
            ),
            // Only show "View →" if redirect is available
            if (redirectType != null) ...[
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () => _handleTap(context),
                child: const Row(
                  children: [
                    Text("View  ",
                        style: TextStyle(color: Colors.blue, fontSize: 14)),
                    Icon(Icons.arrow_forward, size: 14, color: Colors.blue),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
