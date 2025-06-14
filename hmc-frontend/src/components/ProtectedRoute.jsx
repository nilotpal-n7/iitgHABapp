import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  return children;
};
