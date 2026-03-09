import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/room_cleaning_provider.dart';
import '../../models/room_cleaning_slot.dart';
import 'package:intl/intl.dart';
import 'my_cleaning_bookings.dart';

class RoomCleaningScreen extends StatefulWidget {
  const RoomCleaningScreen({super.key});

  @override
  State<RoomCleaningScreen> createState() => _RoomCleaningScreenState();
}

class _RoomCleaningScreenState extends State<RoomCleaningScreen> {
  String selectedWeekDay = _getTodayWeekDay();
  String? selectedSlotId;
  final TextEditingController notesController = TextEditingController();
  late List<DateTime> availableDates;
  DateTime selectedDate = DateTime.now().add(Duration(days: 1));
  bool isBooking = false;


  static String _getTodayWeekDay() {
    return [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ][DateTime.now().weekday - 1];
  }

  @override
  void initState() {
    super.initState();

    availableDates = [
      DateTime.now().add(const Duration(days: 1)),
      DateTime.now().add(const Duration(days: 2)),
    ];

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchSlots();
      final provider = context.read<RoomCleaningProvider>();
      provider.loadLocalBookings();
      provider.fetchMyBookings();
    });
  }


  void _fetchSlots() {
    context
        .read<RoomCleaningProvider>()
        .fetchSlots(
          "69071e409bfe9286a32bf865",    // hardcoded for barak rn
          DateFormat('EEEE').format(selectedDate).toLowerCase(),
        );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  bool _hasBookingForSelectedDate(List<dynamic> bookings) {
    for (final booking in bookings) {
      final status = booking['status']?.toString();
      if (status == 'cancelled') continue;
      final requestedDateRaw = booking['requestedDate']?.toString();
      if (requestedDateRaw == null) continue;
      final requestedDate = DateTime.tryParse(requestedDateRaw);
      if (requestedDate == null) continue;
      if (_isSameDay(requestedDate, selectedDate)) return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              /// Title
              const Text(
                "Room Cleaning",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E2F31),
                  fontFamily: 'OpenSans_regular',
                ),
              ),

              const SizedBox(height: 24),

              /// Weekday Selector
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: availableDates.length,
                  itemBuilder: (context, index) {
                    final date = availableDates[index];
                    final isSelected =
                        selectedDate.day == date.day &&
                            selectedDate.month == date.month &&
                            selectedDate.year == date.year;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            selectedDate = date;
                            selectedSlotId = null;
                          });
                          _fetchSlots();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 8, horizontal: 14),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            color: isSelected
                                ? const Color(0xFFEDEDFB)
                                : const Color(0xFFF5F5F5),
                          ),
                          child: Text(
                            DateFormat('EEE, MMM d').format(date),
                            style: TextStyle(
                              color: isSelected
                                  ? const Color(0xFF4C4EDB)
                                  : const Color(0xFF676767),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),


              const SizedBox(height: 45),

              const Text(
                "Available Slots",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF676767),
                ),
              ),

              const SizedBox(height: 16),

              Expanded(
                child: Consumer<RoomCleaningProvider>(
                  builder: (context, provider, child) {
                    if (provider.isLoading) {
                      return const Center(
                          child: CircularProgressIndicator());
                    }

                    if (provider.errorMessage != null) {
                      return Center(
                        child: Text(
                          provider.errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.red),
                        ),
                      );
                    }

                    final alreadyBookedForDay =
                        provider.hasLocalBookingForDate(selectedDate) ||
                        _hasBookingForSelectedDate(provider.myBookings);
                    if (alreadyBookedForDay) {
                      return const Center(
                        child: Text(
                          "You have already booked a slot for this day",
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

                    if (provider.slots.isEmpty) {
                      return const Center(
                          child: Text("No slots available"));
                    }

                    return ListView.builder(
                      itemCount: provider.slots.length,
                      itemBuilder: (context, index) {
                        final slot = provider.slots[index];
                        final isSelected =
                            selectedSlotId == slot.id;
                        final isFull = slot.availableSlots == 0;

                        final start =
                        DateFormat.Hm().format(slot.startTime);
                        final end =
                        DateFormat.Hm().format(slot.endTime);

                        return Padding(
                          padding:
                          const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            onTap: isFull || alreadyBookedForDay
                                ? null
                                : () {
                              setState(() {
                                selectedSlotId =
                                    slot.id;
                              });
                            },
                            child: Container(
                              padding:
                              const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius:
                                BorderRadius.circular(12),
                                color: isSelected
                                    ? const Color(0xFFEDEDFB)
                                    : const Color(0xFFF5F5F5),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                MainAxisAlignment
                                    .spaceBetween,
                                children: [
                                  Text(
                                    "$start - $end",
                                    style:
                                    const TextStyle(
                                      fontWeight:
                                      FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    isFull
                                        ? "Full"
                                        : "${slot.availableSlots} left",
                                    style: TextStyle(
                                      color: isFull
                                          ? Colors.red
                                          : Colors.green,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              /// Notes
              TextField(
                controller: notesController,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: "Add notes (optional)",
                  filled: true,
                  fillColor:
                  const Color(0xFFF5F5F5),
                  border: OutlineInputBorder(
                    borderRadius:
                    BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              /// Book Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                    const Color(0xFF4C4EDB),
                    padding:
                    const EdgeInsets.symmetric(
                        vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                      BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: selectedSlotId == null || isBooking
                      ? null
                      : () async {
                    final alreadyBookedForDay =
                        _hasBookingForSelectedDate(
                          context.read<RoomCleaningProvider>().myBookings,
                        );
                    if (alreadyBookedForDay) return;

                    setState(() {
                      isBooking = true;
                    });

                    try {
                      RoomCleaningSlot? selectedSlot;
                      final allSlots =
                          context.read<RoomCleaningProvider>().slots;
                      for (final slot in allSlots) {
                        if (slot.id == selectedSlotId) {
                          selectedSlot = slot;
                          break;
                        }
                      }

                      final response = await context
                          .read<RoomCleaningProvider>()
                          .bookSlot(
                        selectedSlotId!,
                        DateFormat('yyyy-MM-dd').format(selectedDate),
                        notesController.text,
                      );

                      if (!mounted) return;

                      if (response['status'] == 'confirmed') {
                        context.read<RoomCleaningProvider>().addLocalBooking(
                          requestedDate: selectedDate,
                          slot: selectedSlot,
                        );
                        setState(() {
                          selectedSlotId = null;
                        });
                        notesController.clear();
                      }

                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(response['message'])),
                      );

                      // Keep local optimistic state; backend dev mocks won't
                      // reflect updated availability immediately.
                    } finally {
                      if (mounted) {
                        setState(() {
                          isBooking = false;
                        });
                      }
                    }
                  },
                  child: const Text(
                    "Book Slot",
                    style: TextStyle(
                      fontWeight:
                      FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Center(
                child: TextButton(
                  onPressed: () {
                    Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (context) => const MyCleaningBookingsScreen())
                    );
                  },
                  child: const Text(
                      "View My Bookings"),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
