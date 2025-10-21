import 'package:flutter/material.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavBar({
    Key? key,
    required this.currentIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // return BottomNavigationBar(
    //   currentIndex: currentIndex,
    //   onTap: onTap,
    //   items: const [
    //     BottomNavigationBarItem(
    //       icon: Icon(Icons.home_rounded),
    //       label: "Home",
    //     ),
    //     BottomNavigationBarItem(
    //       icon: Icon(Icons.restaurant_menu_rounded),
    //       label: "Mess",
    //     ),
    //     BottomNavigationBarItem(
    //       icon: Icon(Icons.report_gmailerrorred_rounded),
    //       label: "Complaints",
    //     ),
    //   ],
    // );
    return Container(
      height: 80,
      decoration: const BoxDecoration(
        color: Color(0xFFF5F5F5),
        border: Border(top: BorderSide(color: Color(0xFFE6E6E6), width: 1))
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Expanded(
            child: InkWell(
              onTap: () {onTap(0);},
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.home_outlined, color: currentIndex==0?const Color(0xFF4C4EDB):const Color(0xFF676767),),
                  const SizedBox(height: 4),
                  Text("Home", style: TextStyle(color: currentIndex==0?const Color(0xFF4C4EDB):const Color(0xFF676767),))
                ],
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () {onTap(1);},
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.restaurant_menu, color: currentIndex==1?const Color(0xFF4C4EDB):const Color(0xFF676767),),
                  const SizedBox(height: 4),
                  Text("Mess", style: TextStyle(color: currentIndex==1?const Color(0xFF4C4EDB):const Color(0xFF676767)),)
                ],
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () {onTap(2);},
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.feedback_outlined, color: currentIndex==2?const Color(0xFF4C4EDB):const Color(0xFF676767),),
                  const SizedBox(height: 4),
                  Text("Complaints", style: TextStyle(color: currentIndex==2?const Color(0xFF4C4EDB):const Color(0xFF676767)),)
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
