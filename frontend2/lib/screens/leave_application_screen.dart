import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_launcher_icons/constants.dart';
import 'package:frontend2/apis/dio_client.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/screens/leave_application_list_screen.dart';
import 'package:intl/intl.dart';
import 'package:frontend2/screens/home_screen.dart';

class LeaveApplicationScreen extends StatefulWidget {
  const LeaveApplicationScreen({super.key});
  @override
  State<LeaveApplicationScreen> createState() => _LeaveApplicationScreenState();
}

class _LeaveApplicationScreenState extends State<LeaveApplicationScreen> {

  int? _selectedValue;
  DateTimeRange? _selectedDateRange;
  PlatformFile? _pickedFile;
  final TextEditingController _accountNumberController = TextEditingController();
  final TextEditingController _ifscController = TextEditingController();
  final TextEditingController _bankNameController = TextEditingController();
  final TextEditingController _accountHolderController = TextEditingController();


  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime(2027),
      builder: (context, child) {
        return Theme(data: ThemeData.light(), child: child!);
      },
    );
    if (picked != null) {
      setState(() => _selectedDateRange = picked);
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'png'],
    );
    if (result != null) {
      setState(() => _pickedFile = result.files.first);
    }
  }

  Future<void> _sendRequest({required int reason, required DateTimeRange range, required PlatformFile file}) async {

    if (file.path == null) { return; }

    final accessToken = await getAccessToken();

    final dio = DioClient().dio;

    try {
      FormData formData = FormData.fromMap({
        "leaveType": reason == 1 ? 'Academic' : 'Medical',
        "startDate": DateFormat("yyyy-MM-dd").format(range.start),
        "endDate": DateFormat("yyyy-MM-dd").format(range.end),
        "proofDocument": await MultipartFile.fromFile(
          file.path!,
          filename: file.name,
        ),
        "bankAccountNumber": _accountNumberController.text,
        "bankIFSCCode": _ifscController.text,
        "bankName": _bankNameController.text,
        "accountHoldersName": _accountHolderController.text,
      });

      final response = await dio.post(
        MessRebateEndpoints.sendApplication,
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $accessToken',
            "Content-Type": "multipart/form-data"
          },
        ),
      );
      if(response.statusCode==200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Application Request Successful!")),
        );
      }

    } catch (e) {
      print(e); // IMPORTANT for debugging
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error")),
      );
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
          "Mess Rebate",
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const HomeScreen(),
              ),
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSection(
              title: "Type of Leave",
              child: Column(
                children: [
                  RadioListTile<int>(
                    title: const Text("Academic Leave"),
                    value: 1,
                    groupValue: _selectedValue,
                    onChanged: (val) => setState(() => _selectedValue = val),
                  ),
                  RadioListTile<int>(
                    title: const Text("Medical Leave"),
                    value: 2,
                    groupValue: _selectedValue,
                    onChanged: (val) => setState(() => _selectedValue = val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),


            _buildSection(
              title: "Leave Duration",
              child: ListTile(
                leading: const Icon(Icons.calendar_month),
                title: Text(_selectedDateRange == null
                    ? "Select Date Range"
                    : "${DateFormat('dd MMM').format(_selectedDateRange!.start)} - ${DateFormat('dd MMM').format(_selectedDateRange!.end)}"),
                trailing: const Icon(Icons.edit),
                onTap: _selectDateRange,
              ),
            ),
            const SizedBox(height: 16),


            _buildSection(
              title: "Supporting Documents",
              child: ListTile(
                leading: const Icon(Icons.upload_file),
                title: Text(_pickedFile == null ? "Upload File (PDF/IMG) (Max. Size - 5MB)" : _pickedFile!.name),
                subtitle: _pickedFile != null ? Text("${(_pickedFile!.size / 1024).toStringAsFixed(2)} KB") : null,
                trailing: const Icon(Icons.attach_file),
                onTap: _pickFile,
              ),
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: "Bank Details",
              child: Column(
                children: [

                  TextField(
                    controller: _accountNumberController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Bank Account Number",
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 12),

                  TextField(
                    controller: _ifscController,
                    decoration: const InputDecoration(
                      labelText: "IFSC Code",
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 12),

                  TextField(
                    controller: _bankNameController,
                    decoration: const InputDecoration(
                      labelText: "Bank Name",
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 12),

                  TextField(
                    controller: _accountHolderController,
                    decoration: const InputDecoration(
                      labelText: "Account Holder Name",
                      border: OutlineInputBorder(),
                    ),
                  ),

                ],
              ),
            ),

            const SizedBox(height: 32),


            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.blueAccent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {

                if (_selectedValue != null && _selectedDateRange != null && _pickedFile!=null) {
                  if ((_pickedFile!.size)/(1024*1024)>=5) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("File size limit - 5MB")),
                    );
                  }else if ((_selectedDateRange!.end.difference(_selectedDateRange!.start).inDays + 1)<5){
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Number of leave days must be >=5")),
                    );
                  }else {
                    _sendRequest(reason: _selectedValue!,
                        range: _selectedDateRange!,
                        file: _pickedFile!);
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Please fill all fields")),
                  );
                }
              },
              child: const Text("Submit Application", style: TextStyle(color: Colors.white, fontSize: 16)),
            ),

            const Divider(),

          ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFFE3F2FD),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const LeaveApplicationListScreen(),
                  ),
                );
              },
              child: const Text("View history", style: TextStyle(color: Colors.blueAccent, fontSize: 14)),
          ),
          ],
        ),
      ),
    );
  }


  Widget _buildSection({required String title, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const Divider(),
          child,
        ],
      ),
    );
  }
}