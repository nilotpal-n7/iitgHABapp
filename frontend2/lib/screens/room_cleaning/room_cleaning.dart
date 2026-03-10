import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../providers/room_cleaning_provider.dart';
import '../../apis/room_cleaning/room_cleaning_api.dart';

/// Slot letter to time range for display (replaces "Slot A" etc. with timing).
const Map<String, String> _slotTimeRange = {
  'A': '12:00–14:00',
  'B': '14:00–16:00',
  'C': '16:00–18:00',
  'D': '18:00–20:00',
};

class RoomCleaningScreen extends StatelessWidget {
  const RoomCleaningScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Builder(
        builder: (context) {
          // Kick off initial loads after first frame.
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final provider =
                Provider.of<RoomCleaningProvider>(context, listen: false);
            provider.loadAvailability();
            provider.loadMyBookings();
          });

          return Scaffold(
            backgroundColor: Colors.white,
            appBar: AppBar(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 0,
              title: const Text(
                'Room Cleaning',
                style: TextStyle(
                  fontFamily: 'OpenSans_regular',
                  fontWeight: FontWeight.w600,
                  fontSize: 18,
                  color: Colors.black,
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(44),
                child: Container(
                  alignment: Alignment.centerLeft,
                  child: const TabBar(
                    labelColor: Color(0xFF3754DB),
                    unselectedLabelColor: Color(0xFF6B7280),
                    indicatorColor: Color(0xFF3754DB),
                    indicatorSize: TabBarIndicatorSize.label,
                    labelStyle: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    unselectedLabelStyle: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                    tabs: [
                      Tab(text: 'Book Slot'),
                      Tab(text: 'My Bookings'),
                    ],
                  ),
                ),
              ),
            ),
            body: const TabBarView(
              children: [
                _BookSlotTab(),
                _MyBookingsTab(),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BookSlotTab extends StatefulWidget {
  const _BookSlotTab();

  @override
  State<_BookSlotTab> createState() => _BookSlotTabState();
}

class _BookSlotTabState extends State<_BookSlotTab> {
  final Set<int> _expandedIndices = {0};

  @override
  Widget build(BuildContext context) {
    return Consumer<RoomCleaningProvider>(
      builder: (context, provider, _) {
        if (provider.isAvailabilityLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final availability = provider.availability;

        if (provider.availabilityError != null) {
          return Center(
            child: Text(
              'Failed to load availability:\n${provider.availabilityError}',
              textAlign: TextAlign.center,
            ),
          );
        }

        if (availability == null) {
          return const Center(child: Text('No availability data.'));
        }

        final days = availability.days;

        if (days.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                availability.canBook
                    ? 'No days are open for booking right now.'
                    : 'You already have a room cleaning booking in the last 2 weeks.',
                textAlign: TextAlign.center,
              ),
            ),
          );
        }

        return SingleChildScrollView(
        child: Padding(
            padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
                if (!availability.canBook)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Expanded(
                          child: Text(
                            'You already have a booking in the last 2 weeks.',
                style: TextStyle(
                              fontFamily: 'OpenSans_regular',
                  fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            final controller = DefaultTabController.of(context);
                            controller.animateTo(1);
                          },
                          child: const Text('View Bookings →'),
                        ),
                      ],
                    ),
                  ),
                // Custom accordion-style dropdowns that match app cards.
                Column(
                  children: [
                    for (var i = 0; i < days.length; i++)
                      _DayCard(
                        day: days[i],
                        isExpanded: _expandedIndices.contains(i),
                        onToggle: () {
                          setState(() {
                            if (_expandedIndices.contains(i)) {
                              _expandedIndices.remove(i);
                            } else {
                              _expandedIndices.add(i);
                            }
                          });
                        },
                        canBook: availability.canBook,
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DayCard extends StatelessWidget {
  final RoomCleaningDayAvailability day;
  final bool isExpanded;
  final VoidCallback onToggle;
  final bool canBook;

  const _DayCard({
    required this.day,
    required this.isExpanded,
    required this.onToggle,
    required this.canBook,
  });

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat('EEE, MMM d').format(day.date);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: onToggle,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
              child: Row(
                children: [
                  Expanded(
                          child: Text(
                          dateLabel,
                          style: const TextStyle(
                            fontFamily: 'OpenSans_regular',
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: Colors.black,
                          ),
                        ),
                  ),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: const Color(0xFF6B7280),
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded)
            const Divider(
              height: 1,
              color: Color(0xFFE5E7EB),
            ),
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 12.0,
                vertical: 8.0,
              ),
              child: Column(
                children: day.slots
                    .map(
                      (slot) => _SlotTile(
                        day: day,
                        slot: slot,
                        canBook: canBook,
                      ),
                    )
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _SlotTile extends StatelessWidget {
  final RoomCleaningDayAvailability day;
  final RoomCleaningSlotAvailability slot;
  final bool canBook;

  const _SlotTile({
    required this.day,
    required this.slot,
    required this.canBook,
  });

  Future<void> _handleBook(BuildContext context) async {
    if (!canBook) return;

    final provider =
        Provider.of<RoomCleaningProvider>(context, listen: false);

    // Load default room & phone from profile (SharedPreferences).
    final prefs = await SharedPreferences.getInstance();
    final initialRoom = prefs.getString('roomNumber') ?? '';
    final initialPhone = prefs.getString('phoneNumber') ?? '';

    final roomController = TextEditingController(text: initialRoom);
    final phoneController = TextEditingController(text: initialPhone);

    final dateLabel = DateFormat('EEE, MMM d').format(day.date);
    final heading = '$dateLabel • ${slot.timeRange}';

    String? localError;

    final shouldBook = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
              titlePadding: const EdgeInsets.only(
                  left: 20, right: 20, top: 18, bottom: 4),
              contentPadding: const EdgeInsets.only(
                  left: 20, right: 20, top: 0, bottom: 4),
              actionsPadding: const EdgeInsets.only(
                  left: 12, right: 12, bottom: 12, top: 4),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Confirm room cleaning slot',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    heading,
                    style: const TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  const _InstructionBullet(
                    text:
                        'Please verify your room number and phone number before confirming this booking.',
                  ),
                  const _InstructionBullet(
                    text:
                        'You can place at most one room cleaning request in any 2‑week period (roughly twice a month).',
                  ),
                  const _InstructionBullet(
                    text:
                        'If you choose a buffer slot, the request may or may not be fulfilled depending on staff availability.',
                  ),
                  const _InstructionBullet(
                    text:
                        'Make sure you are present in your room during the selected time slot.',
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Room number',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: roomController,
                    decoration: InputDecoration(
                      hintText: 'Enter your room number',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Phone number',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      hintText: 'Enter your phone number',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  if (localError != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      localError!,
                      style: const TextStyle(
                        fontFamily: 'OpenSans_regular',
                        fontSize: 12,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(dialogContext).pop(false);
                  },
                  child: const Text(
                    'Go Back',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    final room = roomController.text.trim();
                    final phone = phoneController.text.trim();
                    if (room.isEmpty || phone.isEmpty) {
                      setState(() {
                        localError =
                            'Please fill both room number and phone number.';
                      });
                      return;
                    }
                    Navigator.of(dialogContext).pop(true);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3754DB),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Book Slot',
                style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );

    if (shouldBook == true) {
      // Persist the latest values so profile and future bookings see them.
      await prefs.setString('roomNumber', roomController.text.trim());
      await prefs.setString('phoneNumber', phoneController.text.trim());
    }

    if (shouldBook != true) return;

    final result = await provider.bookSlot(
      date: day.date,
      slot: slot.slot,
    );

    if (!context.mounted) return;

    _showRoomCleaningSnackBar(
      context,
      result.message,
      isError: !result.success,
    );

    if (result.success) {
      await provider.loadMyBookings();
      if (!context.mounted) return;
      DefaultTabController.of(context).animateTo(1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPrimary = slot.slotsLeft > 0;
    final hasBuffer = slot.bufferSlotsLeft > 0;

    final isBookable = canBook && (hasPrimary || hasBuffer);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: ListTile(
        onTap: isBookable ? () => _handleBook(context) : null,
        title: Text(
          slot.timeRange,
          style: const TextStyle(
            fontFamily: 'OpenSans_regular',
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: Colors.black,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasPrimary)
              _pill(
                label: '${slot.slotsLeft} Left',
                color: Colors.green.shade600,
              )
            else ...[
              _pill(
                label: 'Slot Full',
                color: Colors.red.shade600,
              ),
              const SizedBox(width: 6),
              _pill(
                label: hasBuffer
                    ? '${slot.bufferSlotsLeft} Buffer Left'
                    : 'No Buffer',
                color: hasBuffer
                    ? Colors.orange.shade600
                    : Colors.grey.shade600,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _pill({required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _InstructionBullet extends StatelessWidget {
  final String text;

  const _InstructionBullet({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '• ',
            style: TextStyle(fontSize: 13),
          ),
          Expanded(
                        child: Text(
              text,
              style: const TextStyle(
                fontFamily: 'OpenSans_regular',
                fontSize: 13,
                color: Color(0xFF4B5563),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


class _MyBookingsTab extends StatelessWidget {
  const _MyBookingsTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<RoomCleaningProvider>(
      builder: (context, provider, _) {
        if (provider.isBookingsLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.bookingsError != null) {
          return Center(
                        child: Text(
              'Failed to load bookings:\n${provider.bookingsError}',
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

        final bookings = provider.myBookings;
        if (bookings.isEmpty) {
          return const Center(child: Text('No room cleaning bookings yet.'));
        }

        return RefreshIndicator(
          onRefresh: provider.loadMyBookings,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            itemCount: bookings.length,
                      itemBuilder: (context, index) {
              final booking = bookings[index];
              final dateLabel =
                  DateFormat('EEE, MMM d').format(booking.bookingDate);
              final status = booking.status;
              final hasFeedback = booking.feedbackId != null &&
                  booking.feedbackId!.isNotEmpty;

              final statusColor = switch (status) {
                'Cleaned' => Colors.green,
                'Booked' || 'Buffered' => Colors.blue,
                'Cancelled' => Colors.grey,
                'CouldNotBeCleaned' => Colors.red,
                _ => Colors.black,
              };
              final statusLabel =
                  status == 'CouldNotBeCleaned' ? 'Not Cleaned' : status;

              final canCancel = booking.canCancel;

              String? subtitle;
              if (status == 'Cleaned') {
                subtitle = 'Room cleaning completed for this slot.';
              } else if (status == 'Cancelled') {
                subtitle = 'You cancelled this booking.';
              } else if (status == 'CouldNotBeCleaned') {
                final reason = booking.reason ?? '';
                switch (reason) {
                  case 'Student Did Not Respond':
                    subtitle =
                        'The room cleaner couldn’t reach you during this slot (room was locked or you didn’t respond).';
                    break;
                  case 'Student Asked To Cancel':
                    subtitle = 'You asked to cancel this room cleaning.';
                    break;
                  case 'Room Cleaners Not Available':
                    subtitle =
                        'Room cleaners weren’t available during this slot.';
                    break;
                  default:
                    subtitle = 'This room cleaning could not be completed.';
                }
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 16.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18.0,
                    vertical: 16.0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header row: date + slot left, status badge right (top-aligned)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                dateLabel,
                                style: const TextStyle(
                                  fontFamily: 'OpenSans_regular',
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _slotTimeRange[booking.slot] ??
                                    'Slot ${booking.slot}',
                                style: const TextStyle(
                                  fontFamily: 'OpenSans_regular',
                                  fontSize: 13,
                                  color: Color(0xFF6B7280),
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              statusLabel,
                              style: TextStyle(
                                fontFamily: 'OpenSans_regular',
                                color: statusColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Description and actions on one row: description left, buttons right
                      if (subtitle != null ||
                          (status == 'Cleaned' && !hasFeedback) ||
                          canCancel) ...[
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: subtitle != null
                                  ? Text(
                                      subtitle,
                                      style: const TextStyle(
                                        fontFamily: 'OpenSans_regular',
                                        fontSize: 13,
                                        height: 1.35,
                                        color: Color(0xFF6B7280),
                                      ),
                                    )
                                  : const SizedBox.shrink(),
                            ),
                            if ((status == 'Cleaned' && !hasFeedback) ||
                                canCancel) ...[
                              const SizedBox(width: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                alignment: WrapAlignment.end,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  if (status == 'Cleaned' && !hasFeedback)
                                    TextButton(
                                      onPressed: () async {
                                        await _showFeedbackDialog(
                                            context, booking.id);
                                      },
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                        foregroundColor:
                                            const Color(0xFF4C4EDB),
                                      ),
                                      child: const Text(
                                        'Share feedback',
                                        style: TextStyle(
                                          fontFamily: 'OpenSans_regular',
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  if (canCancel)
                                    TextButton(
                                      onPressed: () async {
                                        final result = await Provider.of<
                                                RoomCleaningProvider>(
                                            context,
                                            listen: false)
                                            .cancelBooking(booking.id);
                                        if (!context.mounted) return;
                                        _showRoomCleaningSnackBar(
                                          context,
                                          result.message,
                                          isError: !result.success,
                                        );
                                      },
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                        foregroundColor:
                                            const Color(0xFF6B7280),
                                      ),
                                      child: const Text(
                                        'Cancel booking',
                                        style: TextStyle(
                                          fontFamily: 'OpenSans_regular',
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _FeedbackChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FeedbackChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? const Color(0xFF4C4EDB)
                : Colors.white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected
                  ? const Color(0xFF4C4EDB)
                  : const Color(0xFFE5E7EB),
              width: selected ? 0 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'OpenSans_regular',
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: selected ? Colors.white : const Color(0xFF6B7280),
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _showFeedbackDialog(
  BuildContext context,
  String bookingId,
) async {
  String reachedInSlot = 'Yes';
  String staffPoliteness = 'Yes';
  int satisfaction = 5;
  final remarksController = TextEditingController();

  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            contentPadding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            title: const Text(
              'Room cleaning feedback',
              style: TextStyle(
                fontFamily: 'OpenSans_regular',
                fontWeight: FontWeight.w700,
                fontSize: 18,
                color: Color(0xFF111827),
              ),
            ),
            titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Did the staff visit during your selected slot?',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      for (final value in ['Yes', 'No'])
                        _FeedbackChip(
                          label: value,
                          selected: reachedInSlot == value,
                          onTap: () => setState(() => reachedInSlot = value),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Was the staff polite and professional?',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      for (final value in ['Yes', 'No'])
                        _FeedbackChip(
                          label: value,
                          selected: staffPoliteness == value,
                          onTap: () => setState(() => staffPoliteness = value),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Overall, how satisfied are you?',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(5, (index) {
                      final value = index + 1;
                      final selected = satisfaction == value;
                      return GestureDetector(
                        onTap: () => setState(() => satisfaction = value),
                        child: Container(
                          width: 40,
                          height: 40,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF4C4EDB)
                                : const Color(0xFFF3F4F6),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF4C4EDB)
                                  : const Color(0xFFE5E7EB),
                              width: selected ? 0 : 1,
                            ),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            '$value',
                            style: TextStyle(
                              fontFamily: 'OpenSans_regular',
                              fontSize: 14,
                              fontWeight:
                                  selected ? FontWeight.w600 : FontWeight.w500,
                              color: selected
                                  ? Colors.white
                                  : const Color(0xFF6B7280),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Additional comments (optional)',
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: remarksController,
                    maxLines: 3,
                    style: const TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Anything else you would like us to know?',
                      hintStyle: const TextStyle(
                        fontFamily: 'OpenSans_regular',
                        color: Color(0xFF9CA3AF),
                        fontSize: 14,
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF4C4EDB),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actionsPadding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF6B7280),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                child: const Text(
                  'Skip',
                  style: TextStyle(
                    fontFamily: 'OpenSans_regular',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4C4EDB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Submit',
                  style: TextStyle(
                    fontFamily: 'OpenSans_regular',
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          );
        },
      );
    },
  );

  if (result != true || !context.mounted) return;

  final provider =
      Provider.of<RoomCleaningProvider>(context, listen: false);
  final action = await provider.submitFeedback(
    bookingId: bookingId,
    reachedInSlot: reachedInSlot,
    staffPoliteness: staffPoliteness,
    satisfaction: satisfaction,
    remarks: remarksController.text,
  );

  _showRoomCleaningSnackBar(
    context,
    action.message,
    isError: !action.success,
  );
}

void _showRoomCleaningSnackBar(
  BuildContext context,
  String message, {
  bool isError = false,
}) {
  final theme = Theme.of(context);
  final backgroundColor = isError
      ? const Color(0xFFFFF1F2)
      : const Color(0xFFECFEF3); // soft red / soft green
  final borderColor =
      isError ? const Color(0xFFDC2626) : const Color(0xFF16A34A);
  final icon = isError ? Icons.error_outline : Icons.check_circle_outline;

  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Colors.transparent,
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      content: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: borderColor,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontFamily: 'OpenSans_regular',
                  fontSize: 13,
                  color: const Color(0xFF111827),
                ),
              ),
            ),
            ],
          ),
        ),
      ),
    );
  }

