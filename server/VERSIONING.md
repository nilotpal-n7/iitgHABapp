# API Versioning Guide

This document outlines the steps required when moving to the next Android (or iOS) app version. Our system uses a dual API version strategy to ensure backward compatibility while allowing for breaking changes.

## Overview

The versioning system works as follows:

- **v1 API**: Latest API version, used by current app versions
- **v2 API**: Legacy API version, used by older app versions for backward compatibility
- **Gateway**: Routes requests to appropriate API version based on `x-api-version` header

## Version Logic

The app automatically determines which API version to use based on major version comparison:

| App Version | Server Latest | API Used | Action                               |
| ----------- | ------------- | -------- | ------------------------------------ |
| 1.0.0       | 1.0.0         | v1       | ✅ Normal - Same major version       |
| 1.0.0       | 2.0.0         | v2       | ✅ Legacy mode - 1 version behind    |
| 2.0.0       | 2.0.0         | v1       | ✅ Normal - Same major version       |
| 2.0.0       | 3.0.0         | v2       | ✅ Legacy mode - 1 version behind    |
| 1.0.0       | 3.0.0         | ❌       | ⚠️ Force update - 2+ versions behind |

**Rules:**

1. Same major version → Use V1 API (Latest)
2. 1 major version behind → Use V2 API (Legacy)
3. 2+ major versions behind → Force Update Required

---

## Steps to Move to Next Android Version

### Scenario: Releasing version 2.0.0 (Example)

#### Step 1: Update Flutter App Version

Update `frontend2/pubspec.yaml`:

```yaml
version: 2.0.0+1 # New major version + new build number
```

**Notes:**

- Increment the build number (e.g., from `+4` to `+1` for a new major version)
- Follow semantic versioning: `MAJOR.MINOR.PATCH+BUILD`
- Build number increments on every Play Store release, even for patches

#### Step 2: Migrate Current API to Legacy (v2)

**IMPORTANT:** Before releasing 2.0.0, preserve the current API in v2:

1. Current production API is in `server/v1/`
2. Copy any breaking changes or deprecations to `server/v2/` for backward compatibility
3. Ensure v2 continues to work for users on version 1.x.x
4. **DO NOT** remove functionality from v2 - users on old app versions still need it

**Migration Strategy:**

- If adding new endpoints → Add to v1 only
- If modifying existing endpoints → Keep old behavior in v2, new behavior in v1
- If removing endpoints → Remove from v1, keep in v2

#### Step 3: Update Server Version Configuration

Update **both** API version config files:

**For `server/v1/config/appVersion.json` (newest API):**

```json
{
  "android": {
    "minVersion": "2.0.0", // Minimum version that can use v1 API
    "latestVersion": "2.0.0", // Latest version available
    "storeUrl": "https://play.google.com/store/apps/details?id=in.codingclub.hab",
    "forceUpdate": false, // Set to true if you want to force update
    "updateMessage": "A new version is available. Please update to continue."
  },
  "ios": {
    "minVersion": "2.0.0",
    "latestVersion": "2.0.0",
    "storeUrl": "https://apps.apple.com/app/example/id123456789",
    "forceUpdate": false,
    "updateMessage": "A new version is available. Please update to continue."
  }
}
```

**For `server/v2/config/appVersion.json` (legacy API):**

```json
{
  "android": {
    "minVersion": "1.0.0", // Supports old versions
    "latestVersion": "1.9.x", // Last version that used this API
    "storeUrl": "https://play.google.com/store/apps/details?id=in.codingclub.hab",
    "forceUpdate": false,
    "updateMessage": "A new version is available. Please update to continue."
  },
  "ios": {
    "minVersion": "1.0.0",
    "latestVersion": "1.9.x",
    "storeUrl": "https://apps.apple.com/app/example/id123456789",
    "forceUpdate": false,
    "updateMessage": "A new version is available. Please update to continue."
  }
}
```

**⚠️ IMPORTANT:** You must update **BOTH** files:

- `server/v1/config/appVersion.json`
- `server/v2/config/appVersion.json`

#### Step 4: Update v1 API with New Features

- Add new endpoints/features to `server/v1/`
- v1 will serve version 2.0.0+ apps
- Ensure all new features are backward compatible or clearly documented as breaking changes

#### Step 5: Ensure Backward Compatibility

Verify the following:

- ✅ Version 1.0.0 apps can connect to v2 API (legacy)
- ✅ Version 2.0.0 apps can connect to v1 API (latest)
- ✅ Both API versions are running and accessible
- ✅ Gateway correctly routes based on `x-api-version` header

#### Step 6: Update Version via API (Optional)

You can update version configuration via API endpoint (if admin routes are enabled):

```bash
PUT /api/app-version/android
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "latestVersion": "2.0.0",
  "minVersion": "2.0.0",
  "forceUpdate": false,
  "updateMessage": "New features available! Update now to access latest improvements."
}
```

**Note:** This requires admin authentication. Ensure your admin routes are properly secured.

#### Step 7: Build and Release

Build the new version:

```bash
cd frontend2

# For Play Store (recommended)
flutter build appbundle --release

# For direct APK distribution
flutter build apk --release

# For iOS App Store
flutter build ios --release
```

**Release Checklist:**

- [ ] Update version in `pubspec.yaml`
- [ ] Update server version configs (both v1 and v2)
- [ ] Test on staging environment
- [ ] Build release bundle/APK
- [ ] Upload to Play Store / App Store
- [ ] Monitor version check endpoints after release

#### Step 8: Testing Checklist

Before releasing, verify:

- [ ] Version 1.0.0 app connects to v2 API (legacy mode)
- [ ] Version 2.0.0 app connects to v1 API (latest mode)
- [ ] Version check endpoint (`/api/app-version/android`) returns correct version
- [ ] Force update works if user has version 0.x.x (2+ versions behind)
- [ ] All features work on both API versions
- [ ] Gateway correctly routes requests based on header
- [ ] No breaking changes affect users on legacy API

---

## API Version Endpoints

### Get Version Info

```
GET /api/app-version/{platform}
```

**Parameters:**

- `platform`: `android` or `ios`

**Response:**

```json
{
  "success": true,
  "data": {
    "platform": "android",
    "minVersion": "2.0.0",
    "latestVersion": "2.0.0",
    "storeUrl": "https://play.google.com/store/apps/details?id=in.codingclub.hab",
    "forceUpdate": false,
    "updateMessage": "A new version is available..."
  }
}
```

### Update Version Info (Admin Only)

```
PUT /api/app-version/{platform}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "latestVersion": "2.0.0",
  "minVersion": "2.0.0",
  "storeUrl": "https://play.google.com/store/apps/details?id=in.codingclub.hab",
  "forceUpdate": false,
  "updateMessage": "Custom update message"
}
```

---

## Gateway Routing

The gateway (`server/index.js`) routes requests based on the `x-api-version` header:

- **Header: `x-api-version: v2`** → Routes to `server/v2/` (port 3002)
- **No header or `x-api-version: v1`** → Routes to `server/v1/` (port 3001)

The Flutter app automatically sets this header based on version comparison logic in `VersionChecker`.

---

## Important Notes

1. **Major version increments (1.x → 2.x) trigger API version switching**

   - App version 1.x → Uses v2 API (legacy)
   - App version 2.x → Uses v1 API (latest)

2. **Keep v2 API functional for at least one major version cycle**

   - Users on old app versions still need access
   - Don't remove endpoints from v2 prematurely

3. **Always update both version config files**

   - `v1/config/appVersion.json` (for new versions)
   - `v2/config/appVersion.json` (for legacy support)

4. **Test version check logic before release**

   - Verify version comparison works correctly
   - Test force update scenarios
   - Ensure backward compatibility

5. **Build number increments on every Play Store release**

   - Even for patch releases (e.g., 2.0.0+1, 2.0.1+2, 2.0.2+3)
   - Build number is unique and increasing

6. **Monitor after release**
   - Check server logs for version check requests
   - Monitor error rates on both API versions
   - Track adoption of new app version

---

## Maintenance

### Cleaning Up Old API Versions

**When to remove v2 API:**

- Only after all users have updated to version 2.0.0+
- Check analytics to confirm no users on version 1.x.x
- Give at least 3-6 months after v2.0.0 release
- Announce deprecation well in advance

### Monitoring

Monitor these metrics:

- API version distribution (v1 vs v2 usage)
- App version distribution
- Error rates per API version
- Force update triggers

---

## Troubleshooting

### Issue: App using wrong API version

**Solution:** Check version check endpoint response and app version comparison logic

### Issue: Force update not working

**Solution:** Verify `forceUpdate: true` and `updateMessage` in version config

### Issue: Gateway routing incorrectly

**Solution:** Check `x-api-version` header is being set correctly by the app

### Issue: Legacy API not accessible

**Solution:** Ensure both v1 and v2 servers are running (ports 3001 and 3002)

---

## Version History

| Date       | App Version | v1 API Config        | v2 API Config        | Notes          |
| ---------- | ----------- | -------------------- | -------------------- | -------------- |
| 2025-01-10 | 1.0.0+4     | latestVersion: 1.0.0 | latestVersion: 1.0.0 | Initial setup  |
| TBD        | 2.0.0+1     | latestVersion: 2.0.0 | latestVersion: 1.9.x | Future release |

---

**Last Updated:** January 10, 2025

