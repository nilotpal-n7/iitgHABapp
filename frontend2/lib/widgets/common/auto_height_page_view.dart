import 'package:flutter/material.dart';
import 'package:frontend2/models/mess_menu_model.dart';
import 'package:frontend2/widgets/mess_widgets/menusizeMeasure.dart';

import '../mess_widgets/horizontal_menu_builder.dart'; // import the file you just created

class MenuPager extends StatefulWidget {
  final List<MenuModel> sortedMenus;
  final String messId;
  final String userMessId;

  const MenuPager({
    super.key,
    required this.sortedMenus,
    required this.messId,
    required this.userMessId,
  });

  @override
  State<MenuPager> createState() => _MenuPagerState();
}

DateTime _parseTime(String timeStr) {
  final now = DateTime.now();
  final parts = timeStr.split(':');
  return DateTime(
    now.year,
    now.month,
    now.day,
    int.parse(parts[0]),
    int.parse(parts[1]),
    0,
    0,
  );
}

// _formatDuration was previously used by an older implementation and is
// currently unused (kept earlier for reference in commented code). Removing
// it to satisfy analyzer (unused_element).

class _MenuPagerState extends State<MenuPager> {
  final PageController _pageController = PageController(viewportFraction: 0.95);
  final Map<int, double> _menuHeights = {};
  double _currentHeight = 250;

  // **ADD MAXIMUM HEIGHT LIMIT**
  static const double maxHeight = 400; // Adjust based on your screen

  void _updateHeight(int index, double height) {
    // **CLAMP HEIGHT TO MAXIMUM**
    final clampedHeight = height.clamp(200.0, maxHeight);

    if (_menuHeights[index] != clampedHeight) {
      setState(() {
        _menuHeights[index] = clampedHeight;
        if (_pageController.page?.round() == index ||
            _menuHeights.length == 1) {
          _currentHeight = clampedHeight;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      height: _currentHeight.clamp(200.0, maxHeight), // **CLAMP HERE TOO**
      child: PageView.builder(
        controller: _pageController,
        itemCount: widget.sortedMenus.length,
        itemBuilder: (context, index) {
          final menu = widget.sortedMenus[index];

          return Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: MeasureSize(
              onChange: (size) => _updateHeight(index, size.height),
              child: SingleChildScrollView(
                // **ADD SCROLLING**
                child: IndividualMealCard(
                  menu: menu,
                  isSubscribed: widget.userMessId == widget.messId, // ✅ fixed
                  parseTime: _parseTime,
                  onExpandedChanged: () {
                    // ✅ re-measure after expansion
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      // Trigger measure again
                      setState(() {});
                    });
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
