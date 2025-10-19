import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/apis/protected.dart';
import 'package:frontend2/widgets/common/mess_pref_dropdowns.dart';
import 'package:frontend2/constants/themes.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/endpoint.dart';

class MessChangePreferenceScreen extends StatefulWidget {
  const MessChangePreferenceScreen({super.key});

  @override
  State<MessChangePreferenceScreen> createState() =>
      _MessChangePreferenceScreenState();
}

class _MessChangePreferenceScreenState
    extends State<MessChangePreferenceScreen> {
  bool first = true;
  String? firstpref;
  String? secondpref;
  String? thirdpref;
  bool alreadyApplied = false;
  String? appliedHostel;
  String? defaultMess;
  bool? isMessChangeEnabled;

  bool loadingStatus = true; // track API loading state

  final dio = Dio();

  @override
  void initState() {
    super.initState();
    checkMessChangeStatus();
  }

  /// Helper to show dialogs and refresh after user presses OK
  Future<void> _showMessage(String title, String message,
      {bool refreshAfter = false}) async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // close dialog
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );

    if (refreshAfter && mounted) {
      await checkMessChangeStatus(); // 🔄 refresh after dialog OK
    }
  }

  Future<void> checkMessChangeStatus() async {
    setState(() => loadingStatus = true);

    try {
      final dio = Dio();
      final token = await getAccessToken();

      final res = await dio.get(
        MessChange.messChangeStatus,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (res.statusCode == 200) {
        setState(() {
          alreadyApplied = res.data['applied'] ?? false;
          appliedHostel = res.data['hostel'];
          defaultMess = res.data['default'];
          isMessChangeEnabled = res.data['isMessChangeEnabled'];
          firstpref = null; // reset selection to avoid stale values
          first = true;
        });
      }
    } catch (e) {
      debugPrint('Error fetching mess change status: $e');
      _showMessage("Error", "Unable to fetch mess change status.");
    } finally {
      if (mounted) setState(() => loadingStatus = false);
    }
  }

  Future<void> handleSubmit(String? firstpref) async {
   if (firstpref == null || secondpref == null || thirdpref == null) {
  _showMessage("Error", "Please select all three mess preferences");
  return;
}

if ([firstpref, secondpref, thirdpref].toSet().length < 3) {
  _showMessage("Error", "Preferences must be unique");
  return;
}

if ([firstpref, secondpref, thirdpref].contains(defaultMess)) {
  _showMessage("Error", "Please select messes different from your current mess");
  return;
}

    if (firstpref == defaultMess) {
      _showMessage("Error", "Please select a different mess");
      return;
    }

    try {
      final token = await getAccessToken();
      String url = MessChange.messChangeRequest;

      final res = await dio.post(
        url,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
       data: {
         "mess_pref_1": firstpref,
         "mess_pref_2": secondpref,
         "mess_pref_3": thirdpref,
        },

      );

      if (res.statusCode == 202) {
        _showMessage(
          "Mess Change Rejected",
          "Mess change is only permitted between 24th and 27th of each month.",
          refreshAfter: true,
        );
      } else if (res.statusCode == 200) {
        _showMessage(
          "Success",
          "Form submitted successfully!",
          refreshAfter: true,
        );
      } else {
        _showMessage(
          "Error",
          "Form couldn't be submitted. Try again later!",
          refreshAfter: true,
        );
      }
    } catch (e) {
      if (e is DioException) {
        debugPrint('Error submitting mess change: $e');
        _showMessage(
          "Error",
          "${e.response?.data['message'] ?? "We couldn't process your request!"}",
          refreshAfter: true,
        );
      } else {
        debugPrint('Error submitting mess change: $e');
        _showMessage(
          "Error",
          "We couldn't process your request!",
          refreshAfter: true,
        );
      }
    }
  }

  Future<void> handleCancel() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      String url = MessChange.messChangeCancel;

      final res = await dio.post(
        url,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (res.statusCode == 202) {
        _showMessage(
          "Mess Cancel Rejected",
          "Mess Cancel is only permitted between 24th and 27th of each month.",
          refreshAfter: true,
        );
      } else if (res.statusCode == 200) {
        _showMessage(
          "Success",
          "Mess Change Request Cancelled Successfully!",
          refreshAfter: true,
        );
      } else {
        _showMessage(
          "Error",
          "Form couldn't be submitted. Try again later!",
          refreshAfter: true,
        );
      }
    } catch (e) {
      if (e is DioException) {
        debugPrint('Error submitting mess cancel: $e');
        _showMessage(
          "Error",
          "${e.response?.data['message'] ?? "We couldn't process your request!"}",
          refreshAfter: true,
        );
      } else {
        debugPrint('Error submitting mess cancel: $e');
        _showMessage(
          "Error",
          "We couldn't process your request!",
          refreshAfter: true,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: const BackButton(),
      ),
      body: SafeArea(
        child: loadingStatus
            ? const Center(child: CircularProgressIndicator())
            : Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                child: ListView(
                  children: [
                    const Text(
                      "Mess Preference",
                      style: TextStyle(
                        fontFamily: 'OpenSans_Bold',
                        color: Themes.feedbackColor,
                        fontSize: 32,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Text(
                      'Choose the mess that suits your taste or convenience.',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Info banner if already applied
                    if (alreadyApplied)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.yellow[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'You have already applied for $appliedHostel',
                          style: const TextStyle(color: Colors.black87),
                        ),
                      ),

                    const SizedBox(height: 24),
                    const Text(
                      'Preferences',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),

                    MessChangePrefs(
                      selectedOption: firstpref,
                      onChanged: (value) => setState(() {
                        firstpref = value;
                      }),
                    ),

                    const SizedBox(height: 8),

                      MessChangePrefs(
                        selectedOption: secondpref,
                       onChanged: (value) => setState(() {
                        secondpref = value;
                           }),
                        ),

                        const SizedBox(height: 8),

                       MessChangePrefs(
                       selectedOption: thirdpref,
                        onChanged: (value) => setState(() {
                          thirdpref = value;
                           }),
                    ),

                    if (firstpref == null && !first)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          children: [
                            Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(12, 0, 8, 0),
                              child: SvgPicture.asset(
                                'assets/icon/information-line.svg',
                                height: 16,
                                width: 16,
                              ),
                            ),
                            const Text(
                              'Fill this Section',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFFC40205),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        height: 85,
        decoration: const BoxDecoration(
          //border: Border(top: BorderSide(width: 1, color: Color(0xFFE5E5E5))),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              onPressed: (loadingStatus || alreadyApplied)
                  ? null
                  : () {
                      handleSubmit(firstpref);
                      setState(() => first = false);
                    },
              style: ButtonStyle(
                backgroundColor: WidgetStateProperty.all(
                  (loadingStatus || alreadyApplied)
                      ? Colors.grey
                      : const Color(0xFF4C4EDB),
                ),
                elevation: WidgetStateProperty.all(0),
              ),
              child: Text(
                alreadyApplied
                    ? 'Request already sent to $appliedHostel'
                    : 'Submit',
                style: const TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
            // ElevatedButton(
            //   onPressed: (alreadyApplied)
            //       ? () {
            //           handleCancel();
            //         }
            //       : null,
            //   style: ButtonStyle(
            //     backgroundColor: WidgetStateProperty.all(
            //       (alreadyApplied)
            //           ? const Color.fromARGB(255, 255, 0, 0)
            //           : Colors.grey,
            //     ),
            //     elevation: WidgetStateProperty.all(0),
            //   ),
            //   child: const Text(
            //     'Cancel Mess Request',
            //     style: TextStyle(fontSize: 16, color: Colors.white),
            //   ),
            // ),
          ],
        ),
      ),
    );
  }
}
