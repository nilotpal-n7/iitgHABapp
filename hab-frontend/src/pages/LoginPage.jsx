export function LoginPage() {
  // Deprecated: auth is handled by the central login portal
  const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5172";
  if (typeof window !== "undefined") {
    window.location.replace(`${APP_URL}?portal=hab`);
  }
  return null;
}
