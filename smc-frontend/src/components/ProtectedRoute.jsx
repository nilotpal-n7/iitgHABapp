import { useAuth } from "../context/AuthProvider";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5172";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = APP_URL;
    return null;
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
