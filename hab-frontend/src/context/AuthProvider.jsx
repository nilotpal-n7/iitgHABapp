// frontend/src/context/AuthProvider.jsx
import { createContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken, clearAuthToken } from "../apiClient";

const AuthContext = createContext();

const BACKEND_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api";
const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5172";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const isAuthenticated = !!token;

  // 1️⃣ Initialize from URL or localStorage
  useEffect(() => {
    console.log("[AuthProvider] 🚀 Initializing auth...");
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      console.log(
        "[AuthProvider] Found token in URL:",
        tokenFromUrl.slice(0, 20) + "..."
      );
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      setAuthToken(tokenFromUrl);

      // Clean URL
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("token");
    if (stored) {
      console.log("[AuthProvider] Using stored token.");
      setToken(stored);
      setAuthToken(stored);
      setIsLoading(false);
      return;
    }

    console.warn("[AuthProvider] No token found — redirecting to login.");
    setIsLoading(false);
    window.location.href = APP_URL;
  }, []);

  // 2️⃣ Logout
  const logout = () => {
    console.log("[AuthProvider] Logging out...");
    localStorage.removeItem("token");
    clearAuthToken();
    setToken(null);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    window.location.href = APP_URL;
  };

  // 3️⃣ Validate token + auto logout
  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expire = decoded.exp * 1000 - Date.now();
      console.log(
        `[AuthProvider] Token expires in ${(expire / 1000).toFixed(0)}s`
      );

      if (expire < 1000) {
        console.warn("[AuthProvider] Token expired — logging out.");
        logout();
        return;
      }

      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => {
        console.log("[AuthProvider] Auto logout triggered.");
        logout();
      }, expire);
    } catch (error) {
      console.error("[AuthProvider] Invalid token:", error);
      logout();
    }
  }, [token]);

  // 4️⃣ Sync token with axios
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      clearAuthToken();
    }
  }, [token]);

  const authContextValue = {
    token,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
