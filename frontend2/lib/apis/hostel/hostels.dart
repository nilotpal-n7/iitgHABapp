import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:frontend1/constants/endpoint.dart';

Future<void> fetchAllHostels() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final dio = Dio();
    final response = await dio.get(
      '$baseUrl/hostel/all', // Match your backend route
    );
    print("All Hostels!");
    List<String> all_hostels = [];
    for (Map hostel in response.data) {
      all_hostels.add(hostel['hostel_name']);
    }
    print(all_hostels);
    prefs.setStringList("hostels", all_hostels);
  } catch (e) {
    final prefs = await SharedPreferences.getInstance();
    prefs.setStringList("hostels", [
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
  ]);
  }
}