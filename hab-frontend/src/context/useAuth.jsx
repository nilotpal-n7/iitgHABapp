import { useContext } from "react";
import { AuthContext } from "./AuthProvider.jsx";

// Define and export the hook in its own file
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Add a check to ensure it's used within the provider
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};