<<<<<<< HEAD
import { Navigate, useLocation } from "react-router-dom"; // Import useLocation for redirect state
import { useAuth } from "../context/AuthProvider"; // Assuming AuthProvider is where useAuth comes from

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); // <--- Get isLoading from your AuthProvider
  const location = useLocation(); // To save the current path for redirect after login

  // 1. If still loading authentication status, show a loading indicator.
  // This prevents the flicker to dashboard and then login.
  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  // 2. If not authenticated (and loading is complete), redirect to login.
  // Pass the current path in state so the user can be redirected back after login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If authenticated (and loading is complete), render the children.
  return children;
};

export default ProtectedRoute;
=======
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8
