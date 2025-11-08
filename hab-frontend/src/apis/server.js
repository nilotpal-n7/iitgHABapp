// Read server URL from Vite env (VITE_SERVER_URL), with a fallback.
export const BACKEND_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api";
