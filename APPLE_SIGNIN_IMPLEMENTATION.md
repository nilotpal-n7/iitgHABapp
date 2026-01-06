# Apple Sign In Implementation Plan

## Overview

Add Sign in with Apple as the primary login option, with Microsoft OAuth as an optional "link account" feature to unlock roll number-dependent features.

---

## 🎯 Feature Classification

### ✅ Features Available with Apple Sign In Only

These are view-only features that don't require roll number verification:

1. **View Mess Menus** - Browse menus for all hostels (no auth needed)
2. **View Mess Information** - See ratings, rankings, caterer info (no auth needed)
3. **View Feedback Window Status** - See if feedback window is open (no auth needed)
4. **General Notifications** - Receive general announcements (All_Hostels topic) - doesn't need roll number

### 🔒 Features Requiring Microsoft OAuth (Roll Number)

These require a valid institute roll number to verify student identity:

1. **QR Code Scanning** - Only verified students can scan for mess entry
2. **Submit Mess Feedback** - Only verified students can submit feedback
3. **Mess Change/Preference** - Requires roll number to find hostel allocation
4. **Like Menu Items** - Only verified students can like items
5. **Full Profile** - Roll number and hostel assignment
6. **Personalized "In Mess Today"** - Needs user's current mess (derived from hostel)
7. **Initial Setup** - Needs roll number to assign hostel
8. **Hostel/Mess-Specific Notifications** - Needs roll number to subscribe to hostel/mess-specific topics (Boarders*\*, Subscribers*\*)
9. **User-Specific Notifications** - Needs roll number for direct user notifications (e.g., "Your mess change was approved")

---

## 📋 Implementation Steps

### Backend Changes

#### 1. Update User Model

- Make `rollNumber` optional (currently required)
- Add `hasMicrosoftLinked` boolean field
- Add `microsoftEmail` field (optional)
- Add `authProvider` field: `"apple"` | `"microsoft"` | `"both"`

#### 2. Create Apple Sign In Endpoint

```javascript
// server/modules/auth/auth.controller.js

const appleLoginHandler = async (req, res, next) => {
  try {
    const { identityToken, authorizationCode, email, name } = req.body;

    // Verify Apple token (server-side verification)
    // Extract user info from Apple token

    // Check if user exists by email
    let existingUser = await findUserWithEmail(email);

    if (!existingUser) {
      // Create new user without roll number
      const user = new User({
        name: name || "Apple User",
        email: email,
        rollNumber: null, // Will be set when Microsoft is linked
        authProvider: "apple",
        hasMicrosoftLinked: false,
      });
      existingUser = await user.save();
    }

    const token = existingUser.generateJWT();
    return res.status(200).json({
      token,
      hasMicrosoftLinked: existingUser.hasMicrosoftLinked,
    });
  } catch (err) {
    next(new AppError(500, "Apple login failed"));
  }
};
```

#### 3. Create Microsoft Account Linking Endpoint

```javascript
// server/modules/auth/auth.controller.js

const linkMicrosoftAccount = async (req, res, next) => {
  try {
    const { code } = req.query; // Microsoft OAuth code
    const userId = req.user._id; // From authenticateJWT

    // Exchange code for Microsoft token
    // Get user info from Microsoft Graph
    const roll = userFromToken.data.surname;
    if (!roll) throw new AppError(400, "Invalid Microsoft account");

    // Check if roll number already exists
    const existingUserWithRoll = await User.findOne({ rollNumber: roll });
    if (
      existingUserWithRoll &&
      existingUserWithRoll._id.toString() !== userId.toString()
    ) {
      throw new AppError(
        400,
        "This roll number is already linked to another account"
      );
    }

    // Get hostel allocation
    const allocatedHostel = await getHostelAlloc(roll);
    if (!allocatedHostel) {
      throw new AppError(
        400,
        "Hostel allocation not found for this roll number"
      );
    }

    // Update user with Microsoft info
    const user = await User.findById(userId);
    user.rollNumber = roll;
    user.hostel = allocatedHostel._id;
    user.curr_subscribed_mess = allocatedHostel._id;
    user.microsoftEmail = userFromToken.data.mail;
    user.hasMicrosoftLinked = true;
    user.authProvider = user.authProvider === "apple" ? "both" : "microsoft";

    await user.save();

    return res.status(200).json({
      message: "Microsoft account linked successfully",
      hasMicrosoftLinked: true,
    });
  } catch (err) {
    next(new AppError(500, "Failed to link Microsoft account"));
  }
};
```

#### 4. Add Feature Gating Middleware

```javascript
// server/middleware/requireMicrosoftAuth.js

const requireMicrosoftAuth = async (req, res, next) => {
  const user = req.user; // From authenticateJWT

  if (!user.hasMicrosoftLinked || !user.rollNumber) {
    return next(
      new AppError(403, "Microsoft account linking required for this feature")
    );
  }

  next();
};
```

#### 5. Update Routes

Apply `requireMicrosoftAuth` middleware to all routes that need roll number verification:

```javascript
// server/modules/mess_change/messchangeRoute.js
messChangeRouter.get(
  "/status",
  authenticateJWT,
  requireMicrosoftAuth,
  messChangeStatus
);
messChangeRouter.post(
  "/reqchange",
  authenticateJWT,
  requireMicrosoftAuth,
  messChangeRequest
);

// server/modules/mess/messRoute.js
messRouter.post(
  "/scan/:messId",
  authenticateJWT,
  requireMicrosoftAuth,
  ScanMess
);
messRouter.post(
  "/menu/item/like/:menuItemId",
  authenticateJWT,
  requireMicrosoftAuth,
  toggleLikeMenuItem
);

// server/modules/feedback/feedbackRoute.js
feedbackRouter.post(
  "/submit",
  authenticateJWT,
  requireMicrosoftAuth,
  submitFeedback
);
feedbackRouter.post(
  "/remove",
  authenticateJWT,
  requireMicrosoftAuth,
  removeFeedback
);
feedbackRouter.get(
  "/submitted",
  authenticateJWT,
  requireMicrosoftAuth,
  checkFeedbackSubmitted
);

// server/modules/profile/profileRoute.js
router.post(
  "/setup/complete",
  authenticateJWT,
  requireMicrosoftAuth,
  markSetupComplete
);

// server/modules/notification/notificationController.js
// Update registerToken to handle both general and specific notifications:
const registerToken = async (req, res) => {
  try {
    if (!req.user)
      return res.status(403).json({ error: "Only users can register tokens" });

    const { fcmToken } = req.body;
    if (!fcmToken)
      return res.status(400).json({ error: "FCM token is required" });

    // Always subscribe to general notifications (available to all authenticated users)
    admin.messaging().subscribeToTopic(fcmToken, "All_Hostels");

    // Hostel/mess-specific subscriptions require Microsoft linking
    if (req.user.hasMicrosoftLinked && req.user.rollNumber) {
      const curr_sub_mess_name = (
        await Hostel.findById((await req.user.curr_subscribed_mess)._id)
      )["hostel_name"].replaceAll(" ", "_");

      const userHostel = await Hostel.findById(req.user.hostel);
      const userHostelName = userHostel
        ? userHostel.hostel_name.replaceAll(" ", "_")
        : null;

      // Subscribe based on user's CURRENT HOSTEL
      if (userHostelName) {
        admin
          .messaging()
          .subscribeToTopic(fcmToken, `Boarders_${userHostelName}`);
      }

      // Subscribe based on user's SUBSCRIBED MESS
      admin
        .messaging()
        .subscribeToTopic(fcmToken, `Subscribers_${curr_sub_mess_name}`);

      // Legacy subscription
      admin.messaging().subscribeToTopic(fcmToken, curr_sub_mess_name);
    }

    await FCMToken.findOneAndUpdate(
      { user: req.user._id },
      { token: fcmToken },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "FCM token registered" });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// server/modules/notification/notificationRoute.js
// Keep register-token accessible to all authenticated users (no requireMicrosoftAuth)
router.post("/register-token", authenticateJWT, registerToken);
```

---

### Frontend Changes

#### 1. Update Login Screen

Add "Sign in with Apple" button matching current design pattern:

```dart
// frontend2/lib/screens/login_screen.dart

// In the bottom sheet modal, add Apple Sign In button above Microsoft button:

// Apple Sign In button
SizedBox(
  height: 48,
  width: double.infinity,
  child: Material(
    color: Colors.black, // Apple uses black button
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(50),
    ),
    child: InkWell(
      splashColor: Colors.white24,
      onTap: () async {
        final navigator = Navigator.of(context);
        final messenger = ScaffoldMessenger.of(context);
        try {
          setModalState(() {
            _inprogress = true;
          });
          await signInWithApple();
          setModalState(() {
            _inprogress = false;
          });
          if (!mounted) return;
          navigator.pushReplacement(
            MaterialPageRoute(
              builder: (context) => const MainNavigationScreen(),
            ),
          );
          messenger.showSnackBar(
            const SnackBar(
              content: Center(
                child: Text(
                  'Successfully Logged In',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white),
                ),
              ),
              backgroundColor: Colors.black,
              behavior: SnackBarBehavior.floating,
              margin: EdgeInsets.all(50),
              duration: Duration(milliseconds: 1000),
            ),
          );
        } catch (e) {
          setModalState(() {
            _inprogress = false;
          });
          messenger.showSnackBar(
            const SnackBar(
              content: Center(
                child: Text(
                  'Something Went Wrong',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white),
                ),
              ),
              backgroundColor: Colors.black,
              behavior: SnackBarBehavior.floating,
              margin: EdgeInsets.all(50),
              duration: Duration(milliseconds: 1000),
            ),
          );
        }
      },
      child: const Padding(
        padding: EdgeInsets.all(15),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.apple, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Text(
              'Sign in with Apple',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 14,
                fontFamily: 'GeneralSans',
              ),
            ),
          ],
        ),
      ),
    ),
  ),
),

const SizedBox(height: 10),

// Microsoft login button (existing, keep as "Link Student Account" option)
// ... existing Microsoft button code ...
```

#### 2. Implement Apple Sign In

```dart
// frontend2/lib/apis/authentication/apple_login.dart

Future<void> signInWithApple() async {
  try {
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    // Send to backend
    final dio = Dio();
    final response = await dio.post(
      '$baseUrl/auth/apple',
      data: {
        'identityToken': credential.identityToken,
        'authorizationCode': credential.authorizationCode,
        'email': credential.email,
        'name': '${credential.givenName ?? ''} ${credential.familyName ?? ''}'.trim(),
      },
    );

    final token = response.data['token'];
    final hasMicrosoftLinked = response.data['hasMicrosoftLinked'] ?? false;

    final prefs = await SharedPreferences.getInstance();
    prefs.setString('access_token', token);
    prefs.setBool('hasMicrosoftLinked', hasMicrosoftLinked);

    await fetchUserDetails();
    // ... rest of initialization
  } catch (e) {
    debugPrint('Error during Apple Sign-In: $e');
    rethrow;
  }
}
```

#### 3. Add Microsoft Account Linking Flow

```dart
// frontend2/lib/apis/authentication/link_microsoft.dart

Future<void> linkMicrosoftAccount() async {
  try {
    // Start Microsoft OAuth flow
    final result = await FlutterWebAuth2.authenticate(
      url: AuthEndpoints.getAccess,
      callbackUrlScheme: "iitgcomplain",
    );

    final code = Uri.parse(result).queryParameters['code'];
    if (code == null) throw ('Authorization code not found');

    // Send code to backend linking endpoint
    final token = await getAccessToken();
    final dio = Dio();
    final response = await dio.post(
      '$baseUrl/auth/link-microsoft?code=$code',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );

    // Update local state
    final prefs = await SharedPreferences.getInstance();
    prefs.setBool('hasMicrosoftLinked', true);

    // Refresh user details to get roll number and hostel
    await fetchUserDetails();
    await getUserMessInfo();

    // Re-register FCM token to subscribe to hostel/mess-specific topics
    await registerFcmToken();

  } catch (e) {
    debugPrint('Error linking Microsoft account: $e');
    rethrow;
  }
}
```

#### 4. Add Feature Gating UI

```dart
// frontend2/lib/widgets/microsoft_required_dialog.dart

class MicrosoftRequiredDialog extends StatelessWidget {
  final String featureName;

  const MicrosoftRequiredDialog({required this.featureName});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      title: const Text(
        'Link Student Account Required',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          fontFamily: 'OpenSans_regular',
        ),
      ),
      content: Text(
        'To use $featureName, you need to link your Student Account. '
        'This helps us verify your institute roll number and confirm you are a registered student.',
        style: const TextStyle(
          fontSize: 14,
          color: Colors.black87,
          fontFamily: 'OpenSans_regular',
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            'Cancel',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontFamily: 'OpenSans_regular',
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            linkMicrosoftAccount(); // Start linking flow
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4C4EDB),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Link Account',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              fontFamily: 'OpenSans_regular',
            ),
          ),
        ),
      ],
    );
  }
}
```

#### 5. Update Feature Screens to Check Microsoft Link

**QR Scanner Screen:**

```dart
// frontend2/lib/screens/qr_scanner.dart

@override
void initState() {
  super.initState();
  _checkMicrosoftLink();
  controller = MobileScannerController();
  _checkPermission();
}

Future<void> _checkMicrosoftLink() async {
  final prefs = await SharedPreferences.getInstance();
  final hasMicrosoftLinked = prefs.getBool('hasMicrosoftLinked') ?? false;

  if (!hasMicrosoftLinked && mounted) {
    // Show dialog to link Microsoft account
    showDialog(
      context: context,
      builder: (context) => MicrosoftRequiredDialog(
        featureName: 'QR Code Scanning',
      ),
    );
    // Navigate back
    Navigator.pop(context);
    return;
  }
}
```

**Feedback Submission:**

```dart
// frontend2/lib/widgets/feedback/FeedBackCard.dart

onPressed: () async {
  final prefs = await SharedPreferences.getInstance();
  final hasMicrosoftLinked = prefs.getBool('hasMicrosoftLinked') ?? false;

  if (!hasMicrosoftLinked) {
    showDialog(
      context: context,
      builder: (context) => MicrosoftRequiredDialog(
        featureName: 'Mess Feedback',
      ),
    );
    return;
  }

  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => const MessFeedbackPage(),
    ),
  );
},
```

**Mess Change Screen:**

```dart
// frontend2/lib/screens/mess_preference.dart

@override
void initState() {
  super.initState();
  _checkMicrosoftLink();
  checkMessChangeStatus();
}

Future<void> _checkMicrosoftLink() async {
  final prefs = await SharedPreferences.getInstance();
  final hasMicrosoftLinked = prefs.getBool('hasMicrosoftLinked') ?? false;

  if (!hasMicrosoftLinked) {
    // Show dialog to link Microsoft account
    showDialog(
      context: context,
      builder: (context) => MicrosoftRequiredDialog(
        featureName: 'Mess Change',
      ),
    );
    // Navigate back
    Navigator.pop(context);
    return;
  }
}
```

**Home Screen - Mess Change Button:**

```dart
// frontend2/lib/screens/home_screen.dart

onTap: () async {
  final prefs = await SharedPreferences.getInstance();
  final hasMicrosoftLinked = prefs.getBool('hasMicrosoftLinked') ?? false;

  if (!hasMicrosoftLinked) {
    showDialog(
      context: context,
      builder: (context) => MicrosoftRequiredDialog(
        featureName: 'Mess Change',
      ),
    );
    return;
  }

  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => const MessChangePreferenceScreen(),
    ),
  );
},
```

#### 6. Add "Link Account" Option in Profile

```dart
// frontend2/lib/screens/profile_screen.dart

Widget _buildLinkMicrosoftButton() {
  return FutureBuilder<bool>(
    future: _checkMicrosoftLink(),
    builder: (context, snapshot) {
      if (snapshot.data == false) {
        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF4C4EDB).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF4C4EDB).withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                Icons.link,
                color: const Color(0xFF4C4EDB),
                size: 32,
              ),
              const SizedBox(height: 12),
              const Text(
                'Link Student Account',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  fontFamily: 'OpenSans_regular',
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Link your Student Account to verify your student identity and unlock all features including QR scanning, feedback, and mess change.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                  fontFamily: 'OpenSans_regular',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => linkMicrosoftAccount(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4C4EDB),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Link Account',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'OpenSans_regular',
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }
      return const SizedBox.shrink();
    },
  );
}
```

---

## 🔄 User Flow

### New User (Apple Sign In)

1. User opens app → sees login screen
2. Taps "Sign in with Apple"
3. Completes Apple authentication
4. App creates account (no roll number)
5. User can **view** menus and mess information (read-only features)
6. User receives **general notifications** (All_Hostels topic) - announcements for everyone
7. When trying to use any interactive feature (QR scan, feedback, mess change) → sees "Link Student Account" prompt
8. User links Microsoft account → gets roll number and hostel verified
9. Full access unlocked - can now:
   - Scan QR codes
   - Submit feedback
   - Apply for mess change
   - Receive hostel/mess-specific notifications
   - See personalized "In Mess Today" menu

### Existing User (Microsoft OAuth)

1. User opens app → sees login screen
2. Taps "Sign in with Microsoft" (or "Link Student Account")
3. Completes Microsoft authentication
4. Gets roll number and hostel immediately
5. Full access from start

---

## ✅ Benefits

1. **Satisfies Apple Guideline 4.8** - Offers Sign in with Apple as equivalent option
2. **Security** - Only verified students with roll numbers can use interactive features
3. **Flexible** - Users can start with Apple to browse, link Microsoft when needed
4. **Progressive Enhancement** - View features work immediately, interactive features require verification
5. **User Choice** - Users can choose their preferred login method
6. **Backward Compatible** - Existing Microsoft users continue to work

---

## 🚨 Important Notes

1. **User Model Migration**: Need to make `rollNumber` optional in database
2. **Apple Token Verification**: Must verify Apple tokens server-side (don't trust client)
3. **Email Privacy**: Apple users can hide email - handle this case
4. **Account Merging**: If user links Microsoft to existing Apple account, ensure no conflicts
5. **Roll Number Uniqueness**: Check if roll number is already linked before allowing link

---

## 📱 UI/UX Considerations

1. **Clear Messaging**: Explain why Microsoft linking is needed (student verification)
2. **Prominent CTA**: Make "Link Student Account" prominent when features are locked
3. **Easy Access**: Make "Link Account" easily accessible from profile and locked features
4. **Status Indicators**: Show which features are available/unavailable with clear visual indicators
5. **Smooth Upgrade**: Make linking Microsoft account seamless - one tap from any locked feature
6. **Educational**: Explain that linking is required to verify student identity and ensure only registered students can use interactive features
