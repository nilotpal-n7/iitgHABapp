import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:frontend1/constants/endpoint.dart';
import '../../models/mess_menu_model.dart';

String messId = '';
String token = '';

String getTodayDay() {
  final now = DateTime.now();
  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  return days[now.weekday - 1];
}



Future<void> fetchMessIdAndToken() async {
  final prefs = await SharedPreferences.getInstance();
  messId = '6826dfda8493bb0870b10cbf'; //
  token = prefs.getString('access_token') ?? '';
}

Future<void>



//cache so that it doesnt do api calls when state persists (only does it when app reopens)
final Map<String, List<MenuModel>> _menuCache = {};

Future<List<MenuModel>> fetchMenu(String messId, String day) async {
  final key = '$messId-$day';

  if (_menuCache.containsKey(key)) return _menuCache[key]!;

  final token = (await SharedPreferences.getInstance()).getString('access_token') ?? '';
  final response = await Dio().post(
    '$baseUrl/mess/menu/$messId',
    options: Options(headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    }),
    data: {'day': day},
  );

  if (response.statusCode == 200) {
    final List data = response.data;
    final menu = data.map<MenuModel>((json) => MenuModel.fromJson(json)).toList();
    _menuCache[key] = menu;
    return menu;
  } else {
    throw Exception('Failed to load menu');
  }
}

