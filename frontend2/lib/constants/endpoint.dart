const String baseUrl = "https://hab.codingclub.in/api";

class NotificationEndpoints {
  static const String registerToken = '$baseUrl/notification/register-token';
}

class MessChange {
  static const String messChangeRequest = "$baseUrl/mess-change/reqchange";
  static const String messChangeStatus = "$baseUrl/mess-change/status";
  static const String messChangeCancel = "$baseUrl/mess-change/reqcancel";
}

class UserEndpoints {
  static const String currentUser = '$baseUrl/users/';
  static const String saveUser = '$baseUrl/users/save';
}

class ItemEndpoint {
  static const String getitem = '$baseUrl/items/';
}

class HostelEndpoint {
  static const String getitem = '$baseUrl/hostel/';
}

// Legacy/duplicate auth endpoints removed - use `AuthEndpoints` instead.

class AuthEndpoints {
  // For initial Microsoft login - redirects through backend
  static const String getAccess =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=2cdac4f3-1fda-4348-a057-9bb2e3d184a1&response_type=code&redirect_uri=https://hab.codingclub.in/api/auth/login/redirect/mobile&scope=offline_access%20Files.ReadWrite%20User.Read&state=12345&prompt=consent';

  // For linking Microsoft account - uses same redirect URI as login but with state=link
  static const String linkMicrosoft =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=2cdac4f3-1fda-4348-a057-9bb2e3d184a1&response_type=code&redirect_uri=https://hab.codingclub.in/api/auth/login/redirect/mobile&scope=offline_access%20Files.ReadWrite%20User.Read&state=link&prompt=consent';
}

class Userendpoints {
  static const getdetails = 'https://graph.microsoft.com/v1.0/me';
}

// Legacy token link removed - use `AuthEndpoints` or platform-specific config.

class MessFeedback {
  static const feedbackSubmit = "$baseUrl/feedback/submit";
  static const feedbackSubmitted = "$baseUrl/feedback/submitted";
  static const feedbackSettings = "$baseUrl/feedback/settings";
  static const windowTimeLeft = "$baseUrl/feedback/window-time-left";
}

class MessInfo {
  static const getMessInfo = "$baseUrl/mess/all";
  static const getUserMessInfo = "$baseUrl/mess/get";
}

class ProfilePicture {
  static const changeUserProfilePicture = "$baseUrl/profile/picture/set";
  static const getUserProfilePicture = "$baseUrl/profile/picture/get";
}

class AppVersionEndpoints {
  static const String getAndroidVersion = "$baseUrl/app-version/android";
  static const String getIosVersion = "$baseUrl/app-version/ios";
}
