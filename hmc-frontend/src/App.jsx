import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard.jsx"; // Create this page
import ProtectedRoute from "./components/ProtectedRoute";
//import TestPage1 from "./pages/Home.jsx";
//import TestPage2 from "./pages/Menu.jsx";

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
              <Dashboard/>
            </ProtectedRoute>
          }
        >
          {/* 
          Routing example:- index routes are referenced by "" in the to parameter 
          <Route index element={<Home/>}/>
          <Route path="menu" element={<Menu/>}/>
          */}
        </Route>
      </Routes>
    </div>
  );
}
export default App;
