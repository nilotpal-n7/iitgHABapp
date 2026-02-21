import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../apis/room_cleaning/room_cleaning_api.dart';
import '../models/room_cleaning_slot.dart';

class RoomCleaningProvider extends ChangeNotifier {
  final RoomCleaningApi _api = RoomCleaningApi();

  List<RoomCleaningSlot> slots = [];
  bool isLoading = false;
  String? errorMessage;
  List<dynamic> myBookings = [];
  bool isBookingsLoading = false;
  String? bookingsError;
  bool localBookingsLoaded = false;
  Set<String> localBookedDates = {};

  Future<void> fetchSlots(
      String hostelId, String weekDay) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final rawSlots = await _api.fetchSlots(hostelId, weekDay);
      slots = rawSlots.map((e) => RoomCleaningSlot.fromJson(e)).toList();
    } catch (e) {
      slots = [];
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> bookSlot(
      String slotId,
      String date,
      String notes) async {
    return await _api.bookSlot(
        slotId, date, notes);
  }

  Future<Map<String, dynamic>> cancelBooking(
      String bookingId) async {
    return await _api.cancelBooking(
        bookingId);
  }

  Future<List<dynamic>> getMyBookings() async {
    return await _api.getMyBookings();
  }

  String _dateKey(DateTime date) {
    return "${date.year.toString().padLeft(4, '0')}-"
        "${date.month.toString().padLeft(2, '0')}-"
        "${date.day.toString().padLeft(2, '0')}";
  }

  Future<void> loadLocalBookings() async {
    if (!RoomCleaningApi.isDev) return;
    if (localBookingsLoaded) return;
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList("room_cleaning_booked_dates") ?? [];
    localBookedDates = saved.toSet();
    localBookingsLoaded = true;
    notifyListeners();
  }

  bool hasLocalBookingForDate(DateTime date) {
    return localBookedDates.contains(_dateKey(date));
  }

  Future<void> fetchMyBookings() async {
    isBookingsLoading = true;
    bookingsError = null;
    notifyListeners();

    try {
      myBookings = await _api.getMyBookings();
    } catch (e) {
      myBookings = [];
      bookingsError = e.toString();
    } finally {
      isBookingsLoading = false;
      notifyListeners();
    }
  }

  void addLocalBooking({
    required DateTime requestedDate,
    RoomCleaningSlot? slot,
  }) {
    if (!RoomCleaningApi.isDev) {
      return;
    }
    final booking = {
      '_id': 'local-booking-${DateTime.now().millisecondsSinceEpoch}',
      'requestedDate': requestedDate.toIso8601String(),
      'status': 'confirmed',
      'slot': slot == null
          ? null
          : {
              '_id': slot.id,
              'weekDay': slot.weekDay,
              'startTime': slot.startTime.toIso8601String(),
              'endTime': slot.endTime.toIso8601String(),
            },
    };
    myBookings = [booking, ...myBookings];
    localBookedDates.add(_dateKey(requestedDate));
    SharedPreferences.getInstance().then((prefs) {
      prefs.setStringList(
        "room_cleaning_booked_dates",
        localBookedDates.toList(),
      );
    });
    if (slot != null) {
      slots = slots.map((s) {
        if (s.id != slot.id) return s;
        final nextAvailable = (s.availableSlots - 1);
        return RoomCleaningSlot(
          id: s.id,
          weekDay: s.weekDay,
          startTime: s.startTime,
          endTime: s.endTime,
          availableSlots: nextAvailable < 0 ? 0 : nextAvailable,
        );
      }).toList();
    }
    notifyListeners();
  }
}
