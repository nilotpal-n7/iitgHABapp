import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants/endpoint.dart';

class RoomCleaningApi {
  // Dev-only: uses local emulator base URL from endpoint.dart.
  static const bool isDev = true;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // uncomment this when the backend is deployed
  Future<List<dynamic>> fetchSlots(
      String hostelId, String weekDay) async {

    final response = await http.get(
      Uri.parse(
          "$baseUrl/room-cleaning/slots?hostelId=$hostelId&weekDay=$weekDay"),
      headers: {
        "Content-Type": "application/json"
      },
    );

    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");

    if (response.headers['content-type']?.contains('application/json') ?? false) {
      final data = json.decode(response.body);

      // Handle both possible formats safely
      if (data is List) {
        return data;
      } else if (data is Map && data['slots'] != null) {
        return data['slots'];
      } else {
        return [];
      }
    } else {
      throw Exception("Non JSON response from slots API");
    }
  }


  // Future<List<dynamic>> fetchSlots(
  //     String hostelId, String weekDay) async {
  //
  //   await Future.delayed(Duration(seconds: 1));
  //
  //   return [
  //     {
  //       "_id": "1",
  //       "startTime": "2026-02-15T08:00:00.000Z",
  //       "endTime": "2026-02-15T09:00:00.000Z",
  //       "availableSlots": 3,
  //       "maxSlots": 5,
  //     },
  //     {
  //       "_id": "2",
  //       "startTime": "2026-02-15T09:00:00.000Z",
  //       "endTime": "2026-02-15T10:00:00.000Z",
  //       "availableSlots": 0,
  //       "maxSlots": 5,
  //     },
  //     {
  //       "_id": "3",
  //       "startTime": "2026-02-15T10:00:00.000Z",
  //       "endTime": "2026-02-15T11:00:00.000Z",
  //       "availableSlots": 2,
  //       "maxSlots": 5,
  //     },
  //   ];
  // }



  Future<Map<String, dynamic>> bookSlot(
      String slotId, String requestedDate, String notes) async {

    final token = await _getToken();
    print("TOKEN: $token");

    final response = await http.post(
      Uri.parse("$baseUrl/room-cleaning/booking/request"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
        if (isDev) "x-dev-guest": "1",
      },
      body: json.encode({
        "slotId": slotId,
        "requestedDate": requestedDate,
        "notes": notes,
      }),
    );

    print("STATUS CODE: ${response.statusCode}");
    print("RAW BODY: ${response.body}");

    if (response.headers['content-type']?.contains('application/json') ?? false) {
      return json.decode(response.body);
    } else {
      throw Exception("Server returned non-JSON response");
    }
  }


  Future<Map<String, dynamic>> cancelBooking(
      String bookingId) async {
    final token = await _getToken();

    final response = await http.post(
      Uri.parse(
          "$baseUrl/room-cleaning/booking/cancel"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
        if (isDev) "x-dev-guest": "1",
      },
      body: json.encode({
        "bookingId": bookingId,
      }),
    );

    print("STATUS: ${response.statusCode}");
    print("BODY: ${response.body}");
    if (response.headers['content-type']?.contains('application/json') ?? false) {
      return json.decode(response.body);
    } else {
      throw Exception("Server returned non-JSON response");
    }
  }

  Future<List<dynamic>> getMyBookings() async {
    final token = await _getToken();

    final response = await http.get(
      Uri.parse(
          "$baseUrl/room-cleaning/booking/my"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
        if (isDev) "x-dev-guest": "1",
      },
    );

    if (response.headers['content-type']?.contains('application/json') ?? false) {
      final data = json.decode(response.body);
      return data['bookings'] ?? [];
    } else {
      throw Exception("Server returned non-JSON response");
    }
  }
}
