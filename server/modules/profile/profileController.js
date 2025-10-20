const axios = require("axios");
const { User } = require("../user/userModel.js");
const onedrive = require("../../config/onedrive.js");

const TENANT_ID = onedrive.tenantId; // from onedrive config
const CLIENT_ID = onedrive.clientId; // from onedrive config
const CLIENT_SECRET = onedrive.clientSecret; // from onedrive config
const STORAGE_USER_UPN = onedrive.storageUserUPN; // optional discovery
const DRIVE_ID = onedrive.driveId; // from onedrive config
const PROFILE_FOLDER_ID = onedrive.profilePicsFolderId; // from onedrive config

async function getAppOnlyAccessToken() {
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  params.append("scope", "https://graph.microsoft.com/.default");
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const { data } = await axios.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data.access_token;
}

async function uploadToOneDrive(buffer, fileName, mimeType) {
  if (!DRIVE_ID || !PROFILE_FOLDER_ID) {
    throw new Error(
      "OneDrive configuration missing (DRIVE_ID or PROFILE_FOLDER_ID)"
    );
  }
  const token = await getAppOnlyAccessToken();
  // Simple upload for <4MB files
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${PROFILE_FOLDER_ID}:/${encodeURIComponent(
    fileName
  )}:/content`;
  const { data } = await axios.put(url, buffer, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType || "application/octet-stream",
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return data; // driveItem
}

async function createAnonymousViewLink(itemId) {
  const token = await getAppOnlyAccessToken();
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${itemId}/createLink`;
  const { data } = await axios.post(
    url,
    { type: "view", scope: "anonymous" },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return data?.link?.webUrl;
}

// POST /api/profile/picture/set
async function setProfilePicture(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const user = req.user; // from authenticateJWT
    const originalName = file.originalname || `avatar-${user._id}.jpg`;
    const uploaded = await uploadToOneDrive(
      file.buffer,
      `${user._id}-${Date.now()}-${originalName}`,
      file.mimetype
    );

    // Try to create a public view link (depends on tenant policy). If fails, still save itemId.
    let publicUrl = null;
    try {
      publicUrl = await createAnonymousViewLink(uploaded.id);
    } catch (_) {}

    user.profilePictureItemId = uploaded.id;
    if (publicUrl) user.profilePictureUrl = publicUrl;
    await user.save();

    return res.status(200).json({
      message: "Profile picture updated",
      itemId: uploaded.id,
      url: publicUrl,
    });
  } catch (err) {
    console.error("setProfilePicture error", err.response?.data || err.message);
    return res
      .status(500)
      .json({ message: "Failed to set profile picture", error: err.message });
  }
}

// GET /api/profile/picture/get
async function getProfilePicture(req, res) {
  try {
    const user = req.user;
    if (!user.profilePictureItemId && !user.profilePictureUrl) {
      return res.status(404).json({ message: "No profile picture set" });
    }

    if (user.profilePictureUrl) {
      return res.status(200).json({ url: user.profilePictureUrl });
    }

    // Fallback: stream from Graph using app-only token
    const token = await getAppOnlyAccessToken();
    const contentUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${user.profilePictureItemId}/content`;
    const resp = await axios.get(contentUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${token}` },
    });
    res.setHeader(
      "Content-Type",
      resp.headers["content-type"] || "application/octet-stream"
    );
    return res.send(Buffer.from(resp.data));
  } catch (err) {
    console.error("getProfilePicture error", err.response?.data || err.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch profile picture", error: err.message });
  }
}

module.exports = { setProfilePicture, getProfilePicture };
