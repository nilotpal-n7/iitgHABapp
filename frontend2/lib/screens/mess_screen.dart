import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:frontend1/apis/scan/qrscan.dart';
import 'package:frontend1/screens/mess_feedback/mess_feedback_page.dart';

class MessApp extends StatefulWidget {
  const MessApp({super.key});

  @override
  State<MessApp> createState() => _MessAppState();
}

class _MessAppState extends State<MessApp> {
  @override
  Widget build(BuildContext context) {
    return const MessScreen();
  }
}

class MessScreen extends StatefulWidget {
  const MessScreen({super.key});

  @override
  State<MessScreen> createState() => _MessScreenState();
}

class _MessScreenState extends State<MessScreen> {
  Widget xbuildQuickActions() {
    const usernameBlue = Color(0xFF3754DB);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18.0),
      child: Row(
        children: [
          // New Complaint Button
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {},
              child: Container(
                height: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F6F6),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'assets/icon/complaint.svg',
                      width: 32,
                      height: 32,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Mess complaint",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 18),
          // Mess QR Button
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () {
                setState(() {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => QrScan(),
                    ),
                  );
                });

              },
              child: Container(
                height: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F6F6),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'assets/icon/qrcode.svg',
                      width: 32,
                      height: 32,
                      color: const Color(0xFF3754DB),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Scan mess QR",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context)
        .size; //To make sure everything fits as per device size
    return Scaffold(
      body: Container(
        color: Colors.white,// big bug
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    text: "MESS",
                    style: TextStyle(
                      fontFamily: 'OpenSans_regular',
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                _FeedbackCard(),
                const SizedBox(height: 20),
                xbuildQuickActions(),
                const SizedBox(height: 16),
                _MenuSection(),
                const SizedBox(height: 20),
                _MessInfo(),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FeedbackCard extends StatefulWidget {
  @override
  State<_FeedbackCard> createState() => _FeedbackCardState();
}

class _FeedbackCardState extends State<_FeedbackCard> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How did the mess do this month?',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text("You can help the mess team serve better meals.",
              style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 8),
          Row(
            children: const [
              Icon(Icons.access_time, color: Colors.red, size: 18),
              SizedBox(width: 4),
              Text('Form closes in 2 Days',
                  style: TextStyle(color: Colors.red)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF3754DB),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24)),
              ),
              onPressed: () {
                setState(() {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MessFeedbackPage(),
                    ),
                  );

                });
              },
              child: const Text(
                'Give feedback',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


class _MenuSection extends StatefulWidget {
  @override
  State<_MenuSection> createState() => _MenuSectionState();
}

class _MenuSectionState extends State<_MenuSection> {
  String selectedDay = 'Monday';

  //Rem we have to get this data from backend
  final Map<String, List<String>> menuData = {
    'Monday': ['Choley', 'Aloo Pumpkin Chickpeas', 'Dal Triveni'],
    'Tuesday': ['Rajma', 'Paneer Butter Masala', 'Mix Veg'],
    'Wednesday': ['Kadhi', 'Veg Kofta', 'Methi Aloo'],
    'Thursday': ['Sambhar', 'Aloo Beans', 'Lauki'],
    'Friday': ['Palak Paneer', 'Chana Masala', 'Veg Pulao'],
  };

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text("What’s in Menu",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Spacer(),
            Text(
              "Brahmaputra",
              style: TextStyle(color: Color(0xFF3754DB)),
            ),
            Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF3754DB)),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: menuData.keys.map((day) {
              return _DayChip(
                label: day,
                selected: selectedDay == day,
                onTap: () {
                  setState(() {
                    selectedDay = day;
                  });
                },
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 16),
        _MenuCard(foodItems: menuData[selectedDay]!),
        const SizedBox(height: 10),
        const Center(
          child: Text(
            "Tap on a food item to mark as favourite",
            style: TextStyle(fontSize: 12, color: Colors.black54),
          ),
        ),
      ],
    );
  }
}

class _DayChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DayChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label,style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          fontFamily: 'OpenSans_regular',
        ),),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: Colors.deepPurple.shade100,
        labelStyle:
            TextStyle(color: selected ? Color(0xFF3754DB) : Colors.black),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final List<String> foodItems;

  const _MenuCard({required this.foodItems});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text('Breakfast ', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('In 2 hrs', style: TextStyle(color: Colors.green)),
              Spacer(),
              Text('7:00 AM - 9:45 AM',
                  style: TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
          const SizedBox(height: 16),
          const _SectionHeader(title: 'DISH'),
          PillButtonList(items: foodItems),
          const SizedBox(height: 12),
          const Divider(),
          Row(
            children: const [
              Expanded(child: _SectionHeader(title: 'BREADS & RICE')),
              Expanded(child: _SectionHeader(title: 'OTHERS')),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Expanded(child: PillButtonList(items: ['Bhature', 'Peas Pulao'])),
              Expanded(
                  child: PillButtonList(items: [
                'Imli Chutney',
                'Sweet Lassi',
                'Fruit Custard'
              ])),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(title.toUpperCase(),
          style: const TextStyle(fontSize: 12, color: Colors.black54)),
    );
  }
}



class PillButtonList extends StatefulWidget {
  final List<String> items;

  const PillButtonList({super.key, required this.items});

  @override
  State<PillButtonList> createState() => _PillButtonListState();
}

class _PillButtonListState extends State<PillButtonList> {
  final Set<String> _favorites = {};

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: widget.items.map((item) {
        final isFav = _favorites.contains(item);
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isFav) {
                _favorites.remove(item);
              } else {
                _favorites.add(item);
              }
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(50),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isFav ? Icons.favorite : Icons.favorite_border,
                  size: 16,
                  color: isFav ? Colors.red : Colors.black,
                ),
                const SizedBox(width: 4),
                Text(
                  item,
                  style: TextStyle(
                    fontSize: 14,
                    color: isFav ? Colors.red : Colors.black,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}



class _MessInfo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Mess Info",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text("Caterer Name",
              style: TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 4),
          const Text("Ideal Caterers",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          const Divider(height: 32),
          Row(
            children: const [
              Expanded(
                child: Column(
                  children: [
                    Text("3.8",
                        style: TextStyle(
                            fontSize: 24,
                            color: Color(0xFF3754DB),
                            fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text("Rating", style: TextStyle(fontSize: 12)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  children: [
                    Text("10",
                        style: TextStyle(
                            fontSize: 24,
                            color: Color(0xFF3754DB),
                            fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text("Rank", style: TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
