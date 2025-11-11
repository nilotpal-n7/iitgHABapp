// API Configuration for Hostel Frontend
export const API_BASE_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api";

// Microsoft OAuth URL for hostel login
export const getMicrosoftAuthUrl = (type = "hostel") => {
  const clientId =
    import.meta.env.VITE_CLIENT_ID || "2cdac4f3-1fda-4348-a057-9bb2e3d184a1";
  const redirectUri = encodeURIComponent(
    import.meta.env.VITE_WEB_REDIRECT_URI ||
      "http://localhost:3000/api/auth/login/redirect/web"
  );
  const webBaseUrl = encodeURIComponent(import.meta.env.VITE_WEB_BASE_URL);

  return `https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=user.read&state=${type}&prompt=consent`;
};
