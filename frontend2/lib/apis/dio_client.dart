import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/utilities/version_checker.dart';

class DioClient {
  // Singleton pattern: Ensures we only have one Dio instance across the app
  static final DioClient _instance = DioClient._internal();
  late final Dio _dio;

  factory DioClient() {
    return _instance;
  }

  DioClient._internal() {
    _dio = Dio(BaseOptions(
      // Optional: Set your global timeouts or base URL here
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));

    // ADD THE INTERCEPTOR (Crucial Step)
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Inject the version header dynamically
        options.headers.addAll(VersionChecker.getApiHeaders());
        
        // Helpful Debug Log
        debugPrint("Request: ${options.uri} | Headers: ${options.headers}");
        
        return handler.next(options);
      },
    ));
  }

  // Getter to access the configured Dio instance
  Dio get dio => _dio;
}
