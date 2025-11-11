import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend2/main.dart';
import 'package:provider/provider.dart';
import 'package:frontend2/utilities/startupitem.dart';

// 1. CREATE A FAKE/MOCK PROVIDER
// This class "implements" the real provider, so it has the same functions,
// but we override them to do nothing (or return fake data).
class MockMessInfoProvider extends MessInfoProvider {
  // Override the function that makes a network call
  @override
  Future<void> fetchMessID() async {
    // In the test, we don't want to make a real network call.
    // We just set loading to false and notify listeners,
    // as if the call finished instantly.
    debugPrint('Mock fetchMessID called!'); // This will show in test logs
    isLoading = false;
    notifyListeners();
    return Future.value(); // Return an empty completed future
  }
}

void main() {
  testWidgets('App builds successfully (Smoke Test)', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      // We still provide a MessInfoProvider...
      ChangeNotifierProvider<MessInfoProvider>(
        // ...but we create our FAKE "MockMessInfoProvider" instead!
        create: (_) => MockMessInfoProvider(),
        child: const MyApp(isLoggedIn: true),
      ),
    );

    // After pumpWidget, the mock's fetchMessID() will have been called.
    // The test will no longer crash trying to make a network call.

    // 2. UPDATE THE TEST LOGIC
    // The old test looked for '0' and '1'. That was wrong for your app.
    // This new test does a simple "smoke test": it just verifies
    // that your main app widget (MyApp) successfully built and is on screen.
    expect(find.byType(MyApp), findsOneWidget);

    // TODO: As your app grows, add real tests here.
    // For example, if your app shows a title, you could test for it:
    // expect(find.text('Your App Title'), findsOneWidget);
  });
}