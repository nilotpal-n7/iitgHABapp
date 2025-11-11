import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verify user is SMC
  if (user && !user.isSMC) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold text-red-600">
          Unauthorized: You are not an SMC member
        </div>
      </div>
    );
  }

  return children;
};
