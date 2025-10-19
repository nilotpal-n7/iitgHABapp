import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/providers/hostels.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HostelDrop extends StatefulWidget {
  final Function(String) onChanged;

  const HostelDrop({super.key, required this.onChanged});

  @override
  _HostelDropState createState() => _HostelDropState();
}

class _HostelDropState extends State<HostelDrop> {

  late List<String> options = [""];

  @override
  void initState() {
    super.initState();
    // initHostels();
    HostelsNotifier.addOnChange(() {
      hostels = HostelsNotifier.hostels;
      selectedHostel = HostelsNotifier.userHostel.isNotEmpty?HostelsNotifier.userHostel:(HostelsNotifier.hostels.isNotEmpty?HostelsNotifier.hostels[0]:"");
      print("hostels: $hostels\nselected hostel: $selectedHostel");
    });
  }

  void initHostels() async {
    // final prefs = await SharedPreferences.getInstance();
    // setState(() {
    //   hostels = prefs.getStringList("hostels") ?? [
    //     'Barak',
    //     'Brahmaputra',
    //     'Dhansiri',
    //     'Dihing',
    //     'Disang',
    //     'Gaurang',
    //     'Kameng',
    //     'Kapili',
    //     'Lohit',
    //     'Manas',
    //     'Siang',
    //     'Subansiri',
    //     'Umiam',
    //   ];
    // });
    // selectedHostel = 'Barak';
  }

  String selectedHostel = "";

  List<String> hostels = [];

  // final GlobalKey _key = GlobalKey();

  // void _showDropdownMenu() async {
  //   final RenderBox renderBox = _key.currentContext!.findRenderObject() as RenderBox;
  //   final Offset offset = renderBox.localToGlobal(Offset.zero);

  //   final selected = await showMenu<String>(
  //     context: context,
  //     position: RelativeRect.fromLTRB(
  //       offset.dx,
  //       offset.dy + renderBox.size.height,
  //       offset.dx + 100,
  //       offset.dy,
  //     ),
  //     items: [
  //       PopupMenuItem(
  //         enabled: false,
  //         child: SizedBox(
  //           height: 200, // fixed height for scroll
  //           width: 100,
  //           child: Scrollbar(
  //             child: ListView.builder(
  //               itemCount: hostels.length,
  //               itemBuilder: (context, index) {
  //                 final hostel = hostels[index];
  //                 return ListTile(
  //                   title: Text(
  //                     hostel,
  //                     style: TextStyle(
  //                       color: hostel == selectedHostel ? const Color(0xFF3754DB) : Colors.black,
  //                       fontWeight: FontWeight.w500,
  //                     ),
  //                   ),
  //                   onTap: () {
  //                     Navigator.pop(context, hostel);
  //                   },
  //                 );
  //               },
  //             ),
  //           ),
  //         ),
  //       ),
  //     ],
  //   );

  //   if (selected != null) {
  //     setState(() {
  //       selectedHostel = selected;
  //     });
  //     widget.onChanged(selected);
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    // return GestureDetector(
    //   key: _key,
    //   onTap: _showDropdownMenu,
    //   child: Row(
    //     children: [
    //       Text(
    //         selectedHostel,
    //         style: const TextStyle(
    //           color: Color(0xFF3754DB),
    //           fontWeight: FontWeight.w500,
    //           fontSize: 14
    //         ),
    //       ),
    //       const Icon(Icons.unfold_more, size: 20, color: Color(0xFF3754DB)),
    //     ],
    //   ),
    // );
    return Builder(builder: (context) => hostels.isEmpty || selectedHostel.isEmpty ? SizedBox() :
    DropdownButtonHideUnderline(
      child: SizedBox(
        width: 125,
        child: DropdownButton2<String>(
          isExpanded: true,
          hint: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'Select',
              style: TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                  color: Color(0xFF676767),
                  fontFamily: 'General Sans Variable'),
            ),
          ),
          items: hostels
              .map((String item) => DropdownMenuItem(
            value: item,
            child: Container(
              decoration: BoxDecoration(
                  border: (item == hostels.last
                      ? null
                      : Border(
                      bottom: BorderSide(
                          color: Colors.grey.shade300, width: 1.0)))),
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 8),
              child: Text(item,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                      height: 1.5,
                      color: Color(0xFF2E2F31))),
            ),
          ))
              .toList(),
          selectedItemBuilder: (context) {
            return hostels.map((String item) {
              return Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 9),
                  child: Text(item,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                        color: Color(0xFF676767),
                        decoration: TextDecoration.none,
                      )));
            }).toList();
          },
          value: selectedHostel,
          onChanged: (selected) {
            if (selected != null) {
              setState(() {
                selectedHostel = selected;
              });
              widget.onChanged(selected);
            }
          },
          buttonStyleData: ButtonStyleData(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 8),
              decoration: BoxDecoration(
                  color: selectedHostel == ""
                      ? const Color(0xFFF5F5F5)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                  border: selectedHostel == ""
                      ? Border.all(color: const Color(0xFFC5C5D1), width: 1)
                      : Border.all(color: const Color(0xFFC5C5D1), width: 2))),
          dropdownStyleData: DropdownStyleData(
              maxHeight: MediaQuery.of(context).size.height * 0.6,
              width: 125,
              decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade300, width: 1.0)),
              padding: const EdgeInsets.fromLTRB(0, 8, 0, 8)),
          menuItemStyleData: const MenuItemStyleData(
              height: 48, padding: EdgeInsets.symmetric(horizontal: 12)),
        ),
      ),
    ),);
  }
}
