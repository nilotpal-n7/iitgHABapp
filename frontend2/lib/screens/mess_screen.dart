import 'package:flutter/material.dart';


class MessScreen extends StatefulWidget {
  const MessScreen({super.key});

  @override
  State<MessScreen> createState() => _MessScreenState();
}


// Widget buildMessFeedback(){
//   return
// }

class _MessScreenState extends State<MessScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RichText(
                text: const TextSpan(
                  text: "MESS",
                  style: TextStyle(
                    fontFamily: 'OpenSans_regular',//fill it later font not given yet
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  )
                ),
              ),
              const SizedBox(height: 18),
              // buildMessFeedback(),

            ],
          ),

        )

      ),
    );
  }
}
