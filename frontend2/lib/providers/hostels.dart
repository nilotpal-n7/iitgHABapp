import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/screens/mess_screen.dart';
import 'package:frontend2/widgets/common/hostel_name.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HostelsNotifier {
  static String userHostel = "";
  static var hostelNotifier = ValueNotifier<List<String>>([]);
  static var hostels = <String>[];
  static var onHostelChanged = <void Function()>[];
  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final dio = Dio();
      final response = await dio.get(
        '$baseUrl/hostel/all', // Match your backend route
      );
      hostels = [];
      for (Map hostel in response.data) {
        hostels.add(hostel['hostel_name']);
      }
    } catch (e) {
      hostels = [
        'Barak',
        'Brahmaputra',
        'Dhansiri',
        'Dihing',
        'Disang',
        'Gaurang',
        'Kameng',
        'Kapili',
        'Lohit',
        'Manas',
        'Siang',
        'Subansiri',
        'Umiam',
      ];
    } finally {
      hostelNotifier.value = hostels;

      prefs.setStringList("hostels", hostels);

      if (prefs.getString('hostelID') != null) {
        currSubscribedMess = calculateHostel(prefs.getString('hostelID') ?? "");
        if (hostels.contains(currSubscribedMess)) {
          userHostel = currSubscribedMess;
          prefs.setString("curr_subscribed_mess", currSubscribedMess);
        }
      } else {
        userHostel = hostels[0];
      }
      for (var onChange in onHostelChanged) {
        onChange();
      }
    }
  }

  // Registers a callback and invokes it immediately. Returns a function that
  // when called will deregister the callback. Example usage:
  // final remove = HostelsNotifier.addOnChange(() { ... });
  // remove(); // to deregister
  static VoidCallback addOnChange(void Function() func) {
    try {
      func();
    } catch (e, st) {
      // If the callback fails (for example, because the widget that added it
      // is no longer mounted), swallow the error here — callers should still
      // receive the callback registration and can remove it later.
      print('HostelsNotifier.addOnChange initial call failed: $e');
      print(st);
    }
    onHostelChanged.add(func);
    return () {
      onHostelChanged.remove(func);
    };
  }
}
