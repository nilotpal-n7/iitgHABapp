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
}

class itemEndpoint {
  static const String getitem = '$baseUrl/items/';
}

class hostelEndpoint {
  static const String getitem = '$baseUrl/hostel/';
}

class authendpoint {
  static const String Authendpoint =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize';
}

class tokenendpoint {
  static const Tokenendpoint =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token';
}

class AuthEndpoints {
  static const String getAccess =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=2cdac4f3-1fda-4348-a057-9bb2e3d184a1&response_type=code&redirect_uri=https://hab.codingclub.in/api/auth/login/redirect/mobile&scope=offline_access%20user.read&state=12345&prompt=consent';
}

class Userendpoints {
  static const getdetails = 'https://graph.microsoft.com/v1.0/me';
}


class tokenlink {
  static const Tokenlink =
      'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token';
}

class redirecturi {
  static const Redirecturi =
      '${baseUrl}/auth/login/redirect/mobile';
}



class messFeedback {
  static const feedbackSubmit =
      "$baseUrl/feedback/submit";
}

class messInfo {
  static const getMessInfo = "$baseUrl/mess/all";
  static const getUserMessInfo ="$baseUrl/mess/get";
}

class ProfilePicture {
  static const changeUserProfilePicture = "$baseUrl/profile/picture/set";
  static const getUserProfilePicture = "$baseUrl/profile/picture/get";
}