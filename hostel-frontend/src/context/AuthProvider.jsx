import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../apis";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const logoutTimerRef = useRef(null);

  const isAuthenticated = !!user && !!token;

  // Check token from URL on mount (from Microsoft redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const getData = async (tokenToUse) => {
    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tokenToUse}`;
      const response = await axios.get(`${API_BASE_URL}/hostel/get`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      setUser(response.data.hostel);
    } catch (error) {
      console.error("Error fetching hostel data:", error);
      logout();
    }
  };

  const logout = (reason = null) => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    window.location.href = "http://localhost:5172";
  };

  // Primary useEffect for initial authentication check
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

      try {
        const decoded = jwtDecode(storedToken);
        const expire = decoded.exp * 1000 - Date.now();

        if (expire < 1000) {
          logout("Session has expired");
          return;
        }

        if (token !== storedToken) {
          setToken(storedToken);
        }

        await getData(storedToken);

        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        logoutTimerRef.current = setTimeout(() => {
          logout("Session has expired");
        }, expire);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        logout("Invalid Session");
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
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const authContextValue = {
    user,
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
