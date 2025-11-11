import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Navigate to local /login route and preserve intended path in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
