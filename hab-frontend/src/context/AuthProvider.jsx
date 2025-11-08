import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
const BACKEND_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api";
const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5172";
import { setAuthToken, clearAuthToken } from "../apiClient";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const logoutTimerRef = useRef(null);

  const isAuthenticated = !!token;

  // Check token from URL on mount (from Microsoft redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      setAuthToken(tokenFromUrl);
      window.history.replaceState({}, document.title, location.pathname);
      navigate("/");
    }
  }, [location, navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    clearAuthToken();
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    window.location.href = APP_URL;
  };

  // Primary useEffect for initial authentication check
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

        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        logoutTimerRef.current = setTimeout(() => {
          logout();
        }, expire);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [token]);

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

export const useAuth = () => useContext(AuthContext);
