import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

// In-memory cache for hostel ID to name mapping
Map<String, String> _hostelIdCache = {};
bool _cacheInitialized = false;

/// Initialize the hostel ID cache from SharedPreferences
Future<void> _initializeCache() async {
  if (_cacheInitialized) return;

  try {
    final prefs = await SharedPreferences.getInstance();
    final cachedMap = prefs.getString('hostelIdToNameMap');
    if (cachedMap != null) {
      final map = jsonDecode(cachedMap) as Map<String, dynamic>;
      _hostelIdCache = map.map((key, value) => MapEntry(key, value.toString()));
      _cacheInitialized = true;
    }
  } catch (e) {
    // If cache read fails, cache remains empty
  }
}

/// Updates the in-memory cache (called from HostelsNotifier)
void updateHostelIdCache(Map<String, String> newMap) {
  _hostelIdCache = Map<String, String>.from(newMap);
  _cacheInitialized = true;
}

/// Gets the hostel name from cache synchronously
String _getFromCache(String objectID) {
  if (_cacheInitialized && _hostelIdCache.containsKey(objectID)) {
    return _hostelIdCache[objectID] ?? "Unknown";
  }
  return "";
}

/// Dynamically fetches hostel name from database mapping
/// Falls back to cached data if available, otherwise returns "Unknown"
String calculateHostel(String objectID) {
  // If objectID is empty or null, return Unknown
  if (objectID.isEmpty || objectID == "null" || objectID == "Not provided") {
    return "Unknown";
  }

  // Try to get from in-memory cache first
  final cachedName = _getFromCache(objectID);
  if (cachedName.isNotEmpty) {
    return cachedName;
  }

  // Initialize cache asynchronously (for next time)
  _initializeCache();

  // Fallback: return Unknown if not found
  return "Unknown";
}

/// Async version that ensures cache is checked before returning
Future<String> calculateHostelAsync(String objectID) async {
  // If objectID is empty or null, return Unknown
  if (objectID.isEmpty || objectID == "null" || objectID == "Not provided") {
    return "Unknown";
  }

  // Ensure cache is initialized
  await _initializeCache();

  // Try to get from cache
  if (_hostelIdCache.containsKey(objectID)) {
    return _hostelIdCache[objectID] ?? "Unknown";
  }

  // Fallback: return Unknown if not found
  return "Unknown";
}
