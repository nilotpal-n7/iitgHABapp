import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_launcher_icons/constants.dart';
import 'package:frontend2/apis/dio_client.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:intl/intl.dart';

class LeaveApplicationListScreen extends StatefulWidget {
  const LeaveApplicationListScreen({super.key});

  @override
  State<LeaveApplicationListScreen> createState() => _LeaveApplicationListScreenState();
}

class _LeaveApplicationListScreenState extends State<LeaveApplicationListScreen> {

  var myApplications = [];


  @override
  void initState(){
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory ()async{
    final accessToken = await getAccessToken();
    if (accessToken == 'error') return;
    final dio = DioClient().dio;
    final response = await dio.get(
      MessRebateEndpoints.getApplications,
      options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
    );
    if (response.statusCode == 200) {
      final data = response.data as Map;
      setState(() {
        myApplications.addAll(data['myApplications']);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDEDED),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text(
          "Applications List",
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: myApplications.length,
        itemBuilder: (context, index) {
          final application = myApplications[index];

          final startDate = DateFormat('dd MMM yyyy')
              .format(DateTime.parse(application['startDate']));
          final endDate = DateFormat('dd MMM yyyy')
              .format(DateTime.parse(application['endDate']));

          final status = application['status'] ?? '';

          Color statusColor;
          if (status.toLowerCase() == 'approved') {
            statusColor = Colors.green;
          } else if (status.toLowerCase() == 'rejected') {
            statusColor = Colors.red;
          } else {
            statusColor = Colors.grey;
          }

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: 3,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),

              title: Text(
                application['leaveType'] ?? 'Unknown',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),

              subtitle: Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  "$startDate  →  $endDate",
                  style: TextStyle(
                    color: Colors.grey[700],
                  ),
                ),
              ),

              trailing: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
