import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Home from "./pages/Home";
import AllHostelList from "./pages/AllHostelList";
import Caterers from "./pages/Caterers";
import Students from "./pages/Students";
import HostelForm from "./pages/HostelForm";
import HostelPage from "./pages/HostelPage";
import MessChangePage from "./pages/MessChangePage.jsx";
import FeedbackControl from "./pages/FeedbackControl.jsx";
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
                <div className="min-h-screen bg-gray-50 w-full">
                  <div className="w-full p-6">
                    <div className="flex gap-6 w-full">
                      {/* Sidebar container to match SMC layout */}
                      <div className="h-screen bg-white border border-gray-100 rounded-lg shadow-sm p-3 w-72 flex flex-col">
                        <Sidebar />
                      </div>
                      {/* Main content area */}
                      <div className="flex-1 w-full">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/hostels" element={<AllHostelList />} />
                          <Route
                            path="/create-hostel"
                            element={<HostelForm />}
                          />
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
                          {/** Allocate Hostel and Profile Settings moved into Students page; routes removed */}
                          <Route
                            path="/feedback-control"
                            element={<FeedbackControl />}
                          />
                          {/** Feedback Leaderboard merged into Caterers; route removed */}
                          <Route
                            path="/notifications"
                            element={<Notifications />}
                          />
                        </Routes>
                      </div>
                    </div>
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
