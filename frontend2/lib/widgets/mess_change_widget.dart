import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChangeMessWidget extends StatefulWidget {
  @override
  _ChangeMessWidgetState createState() => _ChangeMessWidgetState();
}

class _ChangeMessWidgetState extends State<ChangeMessWidget> {
  String? _selectedMess; // Confirmed selected mess
  String? _tempSelectedMess; // Temporary selection in the dropdown
  bool _isButtonEnabled = false; // State to control button enable/disable

  @override
  void initState() {
    super.initState();
    _resetButtonStateIfNewWeek(); // Reset state if it's a new week (Monday)
    _checkAllowedDays(); // Check if the button should be enabled
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _isButtonEnabled
              ? () => _showChangeMessDialog(context)
              : null, // Disable button if not within allowed days
          child: Text("Change Mess"),
        ),
      ],
    );
  }

  // Reset button state if it's a new week (Monday)
  Future<void> _resetButtonStateIfNewWeek() async {
    final now = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    final lastResetDateString = prefs.getString('lastResetDate');

    if (lastResetDateString != null) {
      final lastResetDate = DateTime.parse(lastResetDateString);

      // Check if today is Monday and it's a new week compared to the last reset date
      if ((now.weekday == DateTime.monday || now.weekday == DateTime.tuesday || now.weekday == DateTime.wednesday) && now.isAfter(_getStartOfNextWeek(lastResetDate))) {
        await prefs.setBool('clicked', false);
      }
    } else  {
      await prefs.setBool('clicked', false);
      // Initialize the reset date if it doesn't exist
    }
  }

  // Get the start of the next week (Monday) after a given date
  DateTime _getStartOfNextWeek(DateTime date) {
    final daysToNextMonday = (DateTime.monday - date.weekday + 7) % 7;
    return date.add(Duration(days: daysToNextMonday));
  }

  // Check if the button should be enabled
  Future<void> _checkAllowedDays() async {
    final now = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    final clicked = prefs.getBool('clicked') ?? false;

    // Update the state based on the condition
    setState(() {
      _isButtonEnabled = now.weekday >= DateTime.monday &&
          now.weekday <= DateTime.wednesday &&
          !clicked;
    });
  }

  // Show the dialog to change mess
  void _showChangeMessDialog(BuildContext context) {
    _tempSelectedMess = _selectedMess;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: Text("Change Mess"),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Select a Mess:"),
                  DropdownButton<String>(
                    value: _tempSelectedMess,
                    onChanged: (newValue) {
                      setStateDialog(() {
                        _tempSelectedMess = newValue;
                      });
                    },
                    items: <String>[
                      'Lohit',
                      'Kapili',
                      'Manas',
                      'Bhramaputra',
                      'Siang',
                      'Disang'
                    ].map<DropdownMenuItem<String>>((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Close the dialog
                  },
                  child: Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final prefs = await SharedPreferences.getInstance();

                    // Confirm the mess selection on Apply
                    setState(() {
                      _selectedMess = _tempSelectedMess;
                    });
                    await prefs.setString('Hostel', _selectedMess!);
                    await prefs.setBool('clicked', true);

                    // Save the current date as the last press date
                    await prefs.setString('lastResetDate', DateTime.now().toIso8601String());

                    // Show Snackbar
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content:
                        Text('Applied for mess change in $_selectedMess'),
                      ),
                    );

                    // Update button state after applying
                    _checkAllowedDays();

                    Navigator.pop(context); // Close the dialog
                  },
                  child: Text("Apply"),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
