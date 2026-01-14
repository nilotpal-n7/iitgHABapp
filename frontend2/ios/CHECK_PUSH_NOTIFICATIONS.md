# How to Check and Enable Push Notifications in Xcode

## The Problem
APNS token is not being received. This is usually because **Push Notifications capability is not enabled** in Xcode.

## Quick Fix Steps:

### Step 1: Open Xcode Project
```bash
cd frontend2/ios
open Runner.xcworkspace
```

### Step 2: Enable Push Notifications Capability

1. In Xcode, select **Runner** project in the left sidebar (blue icon at top)
2. Select **Runner** target (under TARGETS)
3. Click on **"Signing & Capabilities"** tab
4. Click **"+ Capability"** button (top left)
5. Search for **"Push Notifications"**
6. Double-click to add it

### Step 3: Verify Background Modes

1. Still in **Signing & Capabilities** tab
2. Look for **"Background Modes"** capability
3. If not present, add it:
   - Click **"+ Capability"**
   - Search for **"Background Modes"**
   - Add it
4. Check the box for **"Remote notifications"**

### Step 4: Check Xcode Console

1. Run the app from Xcode (⌘ + R) OR keep `flutter run` running
2. Open Xcode Console:
   - View → Debug Area → Show Debug Area (⌘ + Shift + Y)
   - Or click the bottom panel toggle
3. Look for these logs:
   - `🔵 [AppDelegate] didFinishLaunchingWithOptions`
   - `🔵 [AppDelegate] Calling registerForRemoteNotifications()`
   - `✅ [AppDelegate] didRegisterForRemoteNotificationsWithDeviceToken` (SUCCESS)
   - OR `❌ [AppDelegate] didFailToRegisterForRemoteNotificationsWithError` (FAILURE)

### Step 5: Check for Error 3010

If you see:
```
❌ [AppDelegate] ERROR 3010: Missing Push Notifications capability in Xcode!
```

This confirms Push Notifications capability is NOT enabled. Follow Step 2 above.

## Alternative: Check via Terminal

While app is running, check device logs:

```bash
# For simulator:
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Runner"' | grep -i "AppDelegate\|APNS\|push"

# For real device (connect device first):
idevicesyslog | grep -i "AppDelegate\|APNS\|push"
```

## What to Look For:

### ✅ Success Indicators:
- `✅ [AppDelegate] didRegisterForRemoteNotificationsWithDeviceToken`
- `✅ [AppDelegate] APNS Device Token received: <token>`
- `✅ [AppDelegate] APNS token passed to Firebase Messaging`

### ❌ Failure Indicators:
- `❌ [AppDelegate] ERROR 3010` → Push Notifications capability missing
- `❌ [AppDelegate] ERROR 3000` → APNS certificate issue in Firebase Console
- No AppDelegate logs at all → AppDelegate code not executing

## After Enabling Capability:

1. Clean build folder: Product → Clean Build Folder (⌘ + Shift + K)
2. Rebuild: Product → Build (⌘ + B)
3. Run again: Product → Run (⌘ + R)
4. Check Xcode Console for success logs

## Still Not Working?

1. **Verify Firebase Console:**
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Check if APNS Certificate/Key is uploaded
   - Verify Bundle ID matches: `com.hab.codingclub.dev2`

2. **Check Device:**
   - Must be real iOS device (simulator doesn't support push)
   - Device must have internet connection
   - Device must be signed with valid provisioning profile

3. **Check Provisioning Profile:**
   - Xcode → Signing & Capabilities
   - Ensure "Automatically manage signing" is checked
   - Or manually select a profile that includes Push Notifications entitlement

