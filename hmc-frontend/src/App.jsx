<<<<<<< HEAD

=======
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard.jsx"; // Create this page
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-200">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
export default App;
