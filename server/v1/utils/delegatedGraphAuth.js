const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const axios = require("axios");
const onedrive = require("../config/onedrive.js");

const tokenFilePath =
  process.env.GRAPH_DELEGATED_TOKEN_PATH ||
  path.resolve(__dirname, "..", ".secrets", "graph_delegated_token.json");

let inMemory = {
  access_token: null,
  refresh_token: null,
  expires_at: 0, // epoch ms
};

function tokenEndpoint() {
  const tenant = onedrive.authTenant || onedrive.tenantId || "common";
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
}

async function ensureDir() {
  await fsp.mkdir(path.dirname(tokenFilePath), { recursive: true });
}

async function loadFromDisk() {
  try {
    const raw = await fsp.readFile(tokenFilePath, "utf8");
    const json = JSON.parse(raw);
    if (json.access_token && json.refresh_token && json.expires_at) {
      inMemory = json;
      console.log(
        `[Graph Delegated] Loaded token from disk. Expires at: ${new Date(
          inMemory.expires_at
        ).toISOString()}`
      );
      console.log(
        `[Graph Delegated] Access token (first 24 chars): ${String(
          inMemory.access_token
        ).slice(0, 24)}...`
      );
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

async function saveToDisk() {
  await ensureDir();
  await fsp.writeFile(tokenFilePath, JSON.stringify(inMemory, null, 2), "utf8");
  console.log(
    `[Graph Delegated] Saved token to ${tokenFilePath}. Expires at: ${new Date(
      inMemory.expires_at
    ).toISOString()}`
  );
}

function hasValidToken() {
  const now = Date.now();
  return (
    Boolean(inMemory.access_token) && now < Number(inMemory.expires_at) - 60_000
  );
}

async function refreshIfNeeded() {
  if (hasValidToken()) return inMemory.access_token;

  // Try to load from disk if memory is empty or expired
  if (!hasValidToken()) {
    await loadFromDisk();
    if (hasValidToken()) return inMemory.access_token;
  }

  // Need refresh
  if (!inMemory.refresh_token) {
    throw new Error(
      "No refresh_token available. Start delegated OAuth and save tokens."
    );
  }
  if (!onedrive.clientId) throw new Error("CLIENT_ID missing");

  const params = new URLSearchParams();
  params.append("client_id", onedrive.clientId);
  if (onedrive.clientSecret) {
    // If confidential client, include secret
    params.append("client_secret", onedrive.clientSecret);
  }
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", inMemory.refresh_token);
  // Request the configured scopes
  const scopes =
    Array.isArray(onedrive.graphUserScopes) && onedrive.graphUserScopes.length
      ? onedrive.graphUserScopes.join(" ")
      : "offline_access Files.ReadWrite User.Read";
  params.append("scope", scopes);

  console.log("[Graph Delegated] Refreshing access token...");
  const resp = await axios.post(tokenEndpoint(), params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: (s) => s < 500,
  });
  const data = resp.data || {};
  if (!data.access_token) {
    // Surface better diagnostics
    const hint = `Grant delegated consent for scopes [${scopes}] to app ${onedrive.clientId} and re-authenticate via /api/_debug/graph/start`;
    throw new Error(
      `Failed to refresh delegated token: ${data.error || "unknown_error"} ${
        data.error_description || ""
      }. ${hint}`
    );
  }
  const expiresInSec = Number(data.expires_in || 3600);
  inMemory.access_token = data.access_token;
  inMemory.refresh_token = data.refresh_token || inMemory.refresh_token; // rotate if provided
  inMemory.expires_at = Date.now() + expiresInSec * 1000;

  console.log(
    `[Graph Delegated] New access token acquired. Expires at: ${new Date(
      inMemory.expires_at
    ).toISOString()}`
  );
  console.log(
    `[Graph Delegated] Access token (first 24 chars): ${String(
      inMemory.access_token
    ).slice(0, 24)}...`
  );
  await saveToDisk();
  return inMemory.access_token;
}

async function getDelegatedAccessToken() {
  return refreshIfNeeded();
}

// Helper for manual seeding via scripts if needed
async function setDelegatedTokens({ access_token, refresh_token, expires_at }) {
  if (!access_token || !refresh_token || !expires_at) {
    throw new Error(
      "setDelegatedTokens requires access_token, refresh_token, expires_at (epoch ms)."
    );
  }
  inMemory = { access_token, refresh_token, expires_at: Number(expires_at) };
  await saveToDisk();
}

module.exports = { getDelegatedAccessToken, setDelegatedTokens, tokenFilePath };
