const settings = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  tenantId: process.env.TENANT_ID, // add to .env
  authTenant: process.env.TENANT_ID,
  graphUserScopes: ["user.read", "offline_access", "files.readwrite"],
  // Additional required values for uploads
  driveId: process.env.ONEDRIVE_DRIVE_ID, // add to .env
  profilePicsFolderId: process.env.ONEDRIVE_PROFILE_PICS_FOLDER_ID, // add to .env
  storageUserUPN: process.env.ONEDRIVE_STORAGE_USER_UPN, // add to .env
};

module.exports = settings;
