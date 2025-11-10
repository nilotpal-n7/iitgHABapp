import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Home from "./pages/Home";
import AllHostelList from "./pages/AllHostelList";
import Caterers from "./pages/Caterers";
import Students from "./pages/Students";
import HostelForm from "./pages/HostelForm";
import HostelPage from "./pages/HostelPage";
import MessChangePage from "./pages/MessChangePage.jsx";
import AllocateHostel from "./pages/AllocateHostel.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";
import FeedbackControl from "./pages/FeedbackControl.jsx";
import FeedbackLeaderboard from "./pages/FeedbackLeaderboard.jsx";
import Notifications from "./pages/Notifications.jsx";
import CreateMess from "./components/CreateMess";
import MessDetails from "./components/MessDetails";
import MessMenu from "./components/MessMenu";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

function App() {
  const BASENAME =
    import.meta.env.VITE_BASE ||
    (window.location.pathname.startsWith("/hab") ? "/hab" : "/");

  return (
    <Router basename={BASENAME}>
      <AuthProvider>
        <Routes>
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <div className="flex-1 ml-64 p-6 bg-gray-50 min-h-screen">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Home />} />
                      <Route path="/hostels" element={<AllHostelList />} />
                      <Route path="/create-hostel" element={<HostelForm />} />
                      <Route
                        path="/hostel/:hostelId"
                        element={<HostelPage />}
                      />
                      <Route path="/caterers" element={<Caterers />} />
                      <Route path="/students" element={<Students />} />
                      <Route path="/create-mess" element={<CreateMess />} />
                      <Route path="/mess/:id" element={<MessDetails />} />
                      <Route path="/mess/menu/:id" element={<MessMenu />} />
                      <Route
                        path="/mess/changeapplication"
                        element={<MessChangePage />}
                      />
                      <Route
                        path="/allocate-hostel"
                        element={<AllocateHostel />}
                      />
                      <Route
                        path="/profile-settings"
                        element={<ProfileSettings />}
                      />
                      <Route
                        path="/feedback-control"
                        element={<FeedbackControl />}
                      />
                      <Route
                        path="/feedback-leaderboard"
                        element={<FeedbackLeaderboard />}
                      />
                      <Route
                        path="/notifications"
                        element={<Notifications />}
                      />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
