const settings = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  tenantId: process.env.TENANT_ID, // Resource tenant (your org tenant)
  authTenant: process.env.AUTH_TENANT || process.env.TENANT_ID || "common", // Authority to use for auth flows
  // Delegated scopes (configurable via env). Default to minimum required for /me/drive uploads.
  graphUserScopes: (
    process.env.GRAPH_SCOPES || "User.Read offline_access Files.ReadWrite"
  )
    .split(/\s+/)
    .filter(Boolean),
  // OAuth redirect URI for delegated consent (must match app registration)
  redirectUri: process.env.GRAPH_REDIRECT_URI,
  // Additional required values for uploads
  driveId: process.env.ONEDRIVE_DRIVE_ID, // optional, not used with /me/drive
  profilePicsFolderId: process.env.ONEDRIVE_PROFILE_PICS_FOLDER_ID, // parent folder itemId
  storageUserUPN: process.env.ONEDRIVE_STORAGE_USER_UPN, // storage account UPN (optional)
};

module.exports = settings;
