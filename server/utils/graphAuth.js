const axios = require("axios");
const onedrive = require("../config/onedrive.js");

let cachedToken = null;
let expiryMs = 0; // epoch ms when token expires
let fetchingPromise = null; // to coalesce concurrent requests

function getTokenEndpoint() {
  if (!onedrive.tenantId) {
    throw new Error("TENANT_ID missing in environment");
  }
  return `https://login.microsoftonline.com/${onedrive.tenantId}/oauth2/v2.0/token`;
}

async function fetchNewToken() {
  if (!onedrive.clientId || !onedrive.clientSecret) {
    throw new Error("CLIENT_ID or CLIENT_SECRET missing in environment");
  }
  const params = new URLSearchParams();
  params.append("client_id", onedrive.clientId);
  params.append("client_secret", onedrive.clientSecret);
  params.append("grant_type", "client_credentials");
  params.append("scope", "https://graph.microsoft.com/.default");

  const url = getTokenEndpoint();
  const { data } = await axios.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  // data: { access_token, expires_in, token_type }
  const token = data.access_token;
  const expiresInSec = Number(data.expires_in || 3600);
  cachedToken = token;
  // Refresh 60s before actual expiry
  expiryMs = Date.now() + expiresInSec * 1000;
  return token;
}

async function getAppOnlyAccessToken() {
  const now = Date.now();
  if (cachedToken && now < expiryMs - 60_000) {
    return cachedToken;
  }
  if (fetchingPromise) {
    return fetchingPromise;
  }
  fetchingPromise = (async () => {
    try {
      const token = await fetchNewToken();
      return token;
    } finally {
      fetchingPromise = null;
    }
  })();
  return fetchingPromise;
}

module.exports = { getAppOnlyAccessToken };
