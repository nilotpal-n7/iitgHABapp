import { createContext, useContext, useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
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

  useEffect(() => {
    const initializeFromServer = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");

      if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
        setToken(tokenFromUrl);
        setAuthToken(tokenFromUrl);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      try {
        const resp = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data?.token) {
            localStorage.setItem("token", data.token);
            setToken(data.token);
            setAuthToken(data.token);
          } else if (!tokenFromUrl && localStorage.getItem("token")) {
            const stored = localStorage.getItem("token");
            setToken(stored);
            setAuthToken(stored);
          }
        } else {
          localStorage.removeItem("token");
          setToken(null);
          clearAuthToken();
          window.location.href = APP_URL;
        }
      } catch (err) {
        console.error("Auth check failed", err);
        localStorage.removeItem("token");
        setToken(null);
        clearAuthToken();
        window.location.href = APP_URL;
      } finally {
        setIsLoading(false);
      }
    };

    initializeFromServer();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.warn(
        "Server logout call failed, continuing to clear local state",
        err
      );
    }

    localStorage.removeItem("token");
    setToken(null);
    clearAuthToken();
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    // Redirect to login page (the root, hosted separately)
    window.location.href = APP_URL;
  };

  // ✅ On mount: check and validate token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setToken(null);
        setIsLoading(false);
        window.location.href = APP_URL;
        return;
      }

      setAuthToken(storedToken);

      try {
        const decoded = jwtDecode(storedToken);
        const expire = decoded.exp * 1000 - Date.now();

        if (expire < 1000) {
          logout();
          return;
        }

        if (token !== storedToken) {
          setToken(storedToken);
        }

        // Auto logout when token expires
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        logoutTimerRef.current = setTimeout(() => logout(), expire);
      } catch (error) {
        console.error("Error validating token:", error);
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

  // Keep axios headers in sync
  useEffect(() => {
    if (token) setAuthToken(token);
    else clearAuthToken();
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

export const useAuth = () => useContext(AuthContext);
