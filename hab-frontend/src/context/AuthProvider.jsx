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
  // const navigate = useNavigate();
  // const location = useLocation();
  const logoutTimerRef = useRef(null);

  const isAuthenticated = !!token;

  // ✅ Check token in URL after redirect (from backend login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    console.log("🔍 TOKEN FROM URL:", tokenFromUrl);
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      setAuthToken(tokenFromUrl);
      console.log("✅ Token stored in localStorage");
    } else {
      console.log("❌ No token param found in URL");
    }
  }, []);

  // ✅ Logout function
  const logout = () => {
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
