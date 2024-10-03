const String baseUrl = "https://iitgcomplaintapp.onrender.com/api";

class UserEndpoints {
  static const String currentUser = '$baseUrl/users/';
}


class AuthEndpoints {
  static const String getAccess = 'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=10097bd9-bd33-4181-aced-b041440acade&response_type=code&redirect_uri=https://iitgcomplaintapp.onrender.com/api/auth/login/redirect/mobile&scope=offline_access%20user.read&state=12345&prompt=consent';
}

class Userendpoints {
  static const getdetails = 'https://graph.microsoft.com/v1.0/me';
}

class clientid {
  static const Clientid = '10097bd9-bd33-4181-aced-b041440acade';
}

class tokenlink {
  static const Tokenlink = 'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token';
}

class redirecturi {
  static const Redirecturi = 'https://iitgcomplaintapp.onrender.com/api/auth/login/redirect/mobile';
}

class clientSecretid {
  static const Clientscret = 'w1h8Q~_.YUQPkHuorB4gaOJJcvkkPYc7qi70nc.B';
}