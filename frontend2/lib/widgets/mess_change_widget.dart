import 'package:flutter/material.dart';

class ChangeMessWidget extends StatefulWidget {
  @override
  _ChangeMessWidgetState createState() => _ChangeMessWidgetState();
}

class _ChangeMessWidgetState extends State<ChangeMessWidget> {
  String? _selectedMess; // Confirmed selected mess
  String? _tempSelectedMess; // Temporary selection in the dropdown

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () {
            _showChangeMessDialog(context);
          },
          child: Text("Change Mess"),
        ),
      ],
    );
  }

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
                    items: <String>['Lohit', 'Kapili', 'Manas', 'Bhramaputra', 'Siang', 'Disang']
                        .map<DropdownMenuItem<String>>((String value) {
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
                  onPressed: () {
                    // Confirm the mess selection on Apply
                    setState(() {
                      _selectedMess = _tempSelectedMess;
                    });
                    // Show Snackbar
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Applied for mess change in $_selectedMess'),
                      ),
                    );
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