import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const login = async (hostel_name, password) => {
    try {
      const res = await axios.post("http://localhost:800/api/hostel/login", {
        hostel_name,
        password,
      });

      localStorage.setItem("token", res.data.token); // Save JWT
      setToken(res.data.token);
      setUser(res.data.hostel); // Save hostel in context
      navigate("/dashboard"); // Navigate to protected route
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    navigate("/login");
  };

  const getData = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`http://localhost:800/api/hostel/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.hostel);
    } catch (err) {
      logout(); // Invalid token, log out user
    }
  };

  useEffect(() => {
    getData().finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
