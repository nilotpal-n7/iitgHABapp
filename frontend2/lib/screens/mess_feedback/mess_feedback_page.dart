import 'package:flutter/material.dart';
import 'package:frontend1/constants/themes.dart';

import 'package:provider/provider.dart';

import '../../providers/feedback_provider.dart';
import '../../widgets/feedback/custom_option.dart';
import 'comment_page.dart';


class MessFeedbackPage extends StatelessWidget {
  final List<String> options = [
    'Very Poor',
    'Poor',
    'Average',
    'Good',
    'Very Good'
  ];

  Widget mealBlock(String meal, String selected, Function(String) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [

        Text(meal, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(
          height: 8,
        ),
        ...options.map((option) => customOption(
              text: option,
              groupValue: selected,
              value: option,
              onChanged: onChanged,
            )),
      ],
    );
  }
  

  @override
  Widget build(BuildContext context) {

    final provider = Provider.of<FeedbackProvider>(context);




    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: const BackButton(),
      ),
      body: Container(
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Mess Feedback",
                style: TextStyle(
                    fontFamily: 'OpenSans_Bold',
                    color: Themes.feedbackColor,
                    fontSize: 32,
                    fontWeight: FontWeight.w700),
              ),
              const SizedBox(
                height: 32,
              ),
              const Text("Step 1 / 2", style: TextStyle(color: Colors.deepPurple)),
              const SizedBox(
                height: 11,
              ),
              const LinearProgressIndicator(value: 0.5, color: Colors.deepPurple),
              const SizedBox(height: 16),
              const SizedBox(height: 8),
              Expanded(
                child: ListView(
                  children: [
                    const Text(
                      "How satisfied are you with the respective meals?",
                      style: TextStyle(
                          fontFamily: 'OpenSans-Regular',
                          fontWeight: FontWeight.w500,
                          fontSize: 20),
                    ),

                    const SizedBox(
                      height: 24,
                    ),
                    mealBlock("Breakfast", provider.breakfast,
                        (val) => provider.setMealFeedback('breakfast', val)),
                    mealBlock("Lunch", provider.lunch,
                        (val) => provider.setMealFeedback('lunch', val)),
                    mealBlock("Dinner", provider.dinner,
                        (val) => provider.setMealFeedback('dinner', val)),
                  ],
                ),
              ),
              Center(
                child: GestureDetector(
                  onTap: provider.isComplete()
                      ? () => Navigator.push(context,
                          MaterialPageRoute(builder: (_) => CommentPage()))
                      : null,
                  child: Container(
                    width: 358,
                    height: 54,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding:
                        const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(76, 78, 219, 1),

                      borderRadius: BorderRadius.circular(9999), // pill shape
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 12),
                        Text(
                          'Next',
                          style: TextStyle(
                            fontFamily: 'OpenSans-Regular',
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
