import { createContext, useContext, useState, useEffect, useRef } from "react";
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

  // ==========================================================
  // 1️⃣ INITIAL CHECK — read token from URL or verify session with /auth/me
  // ==========================================================
  useEffect(() => {
    const initializeFromServer = async () => {
      console.log("[AuthProvider] 🚀 Initializing from server...");
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");

      // Dev mode: If token is in URL (redirect param), store it
      if (tokenFromUrl) {
        console.log(
          "[AuthProvider] Found token in URL:",
          tokenFromUrl.slice(0, 20) + "..."
        );
        localStorage.setItem("token", tokenFromUrl);
        setToken(tokenFromUrl);
        setAuthToken(tokenFromUrl);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      try {
        console.log("[AuthProvider] Checking backend session at /auth/me...");
        const resp = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (resp.ok) {
          const data = await resp.json();
          console.log("[AuthProvider] /auth/me response:", data);

          if (data.authenticated) {
            console.log("[AuthProvider] ✅ Authenticated via backend cookie.");
            // Optional: mirror this for React’s state
            setToken("cookie-session");
            setAuthToken(null); // don’t attach Bearer token, rely on cookie
            setIsLoading(false);
            return;
          } else {
            console.warn("[AuthProvider] /auth/me says not authenticated.");
          }
        } else {
          console.warn("[AuthProvider] ❌ /auth/me failed:", resp.status);
        }
      } catch (err) {
        console.error("[AuthProvider] ⚠️ Auth check failed:", err);
      }

      // Fallback: try existing local token if present
      const stored = localStorage.getItem("token");
      if (stored) {
        console.log("[AuthProvider] Using existing local token fallback.");
        setToken(stored);
        setAuthToken(stored);
        setIsLoading(false);
        return;
      }

      // No cookie and no local token → redirect to login
      console.warn(
        "[AuthProvider] ❌ No valid session — redirecting to login."
      );
      localStorage.removeItem("token");
      setToken(null);
      clearAuthToken();
      setIsLoading(false);
      window.location.href = APP_URL;
    };

    initializeFromServer();
  }, []);

  // ==========================================================
  // 2️⃣ LOGOUT HANDLER
  // ==========================================================
  const logout = async () => {
    console.log("[AuthProvider] 🧹 Logging out...");
    try {
      const resp = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
      console.log("[AuthProvider] /auth/logout response:", resp.status);
    } catch (err) {
      console.warn("[AuthProvider] Server logout call failed:", err);
    }

    localStorage.removeItem("token");
    setToken(null);
    clearAuthToken();
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    console.log("[AuthProvider] Redirecting to login page:", APP_URL);
    window.location.href = APP_URL;
  };

  // ==========================================================
  // 3️⃣ LOCAL TOKEN VALIDATION & AUTO LOGOUT (for dev mode only)
  // ==========================================================
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      // In production, cookies handle session — skip this
      if (import.meta.env.MODE === "production") {
        console.log(
          "[AuthProvider] Production mode — skipping local JWT checks."
        );
        setIsLoading(false);
        return;
      }

      console.log("[AuthProvider] 🔍 Checking local token validity...");
      if (!storedToken) {
        console.warn(
          "[AuthProvider] No local token found — redirecting to login."
        );
        setToken(null);
        setIsLoading(false);
        window.location.href = APP_URL;
        return;
      }

      setAuthToken(storedToken);

      try {
        const decoded = jwtDecode(storedToken);
        const expire = decoded.exp * 1000 - Date.now();
        console.log(
          `[AuthProvider] Decoded token exp in ${(expire / 1000).toFixed(1)}s`
        );

        if (expire < 1000) {
          console.warn("[AuthProvider] Token expired — logging out.");
          logout();
          return;
        }

        if (token !== storedToken) setToken(storedToken);

        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = setTimeout(() => {
          console.log(
            "[AuthProvider] ⏰ Token expired — auto logout triggered."
          );
          logout();
        }, expire);
      } catch (error) {
        console.error("[AuthProvider] Error decoding token:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [token]);

  // ==========================================================
  // 4️⃣ SYNC TOKEN TO AXIOS
  // ==========================================================
  useEffect(() => {
    if (token && token !== "cookie-session") {
      console.log("[AuthProvider] ✅ Token set — syncing with axios.");
      setAuthToken(token);
    } else {
      console.warn("[AuthProvider] ❌ No Bearer token — clearing axios auth.");
      clearAuthToken();
    }
  }, [token]);

  // ==========================================================
  // PROVIDER CONTEXT EXPORT
  // ==========================================================
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

export const useAuth = () => useContext(AuthContext);
