import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import { API_BASE_URL } from "../apis";
import axios from "axios";
import {
  Users,
  UtensilsCrossed,
  FileText,
  UserCheck,
  Building2,
  LogOut,
  Bell,
} from "lucide-react";
import NotificationSender from "../components/NotificationSender";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import MessBillCalculator from "../components/MessBillCalculator";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("caterer");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State for different sections
  const [catererInfo, setCatererInfo] = useState(null);
  const [boarders, setBoarders] = useState([]);
  const [messSubscribers, setMessSubscribers] = useState([]);
  const [smcMembers, setSmcMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch caterer info
  const fetchCatererInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hostel/caterer-info`);
      setCatererInfo(response.data);
    } catch (err) {
      setError("Failed to fetch caterer info: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch boarders
  const fetchBoarders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hostel/boarders`);
      setBoarders(response.data.boarders || []);
    } catch (err) {
      setError("Failed to fetch boarders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch mess subscribers
  const fetchMessSubscribers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/hostel/mess-subscribers`
      );
      setMessSubscribers(response.data.subscribers || []);
    } catch (err) {
      setError("Failed to fetch mess subscribers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SMC members
  const fetchSMCMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hostel/smc-members`);
      setSmcMembers(response.data.smcMembers || []);
    } catch (err) {
      setError("Failed to fetch SMC members: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark user as SMC
  const markAsSMC = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated. Please login again.");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/hostel/mark-smc`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchSMCMembers();
      await fetchBoarders();
    } catch (err) {
      console.error("Error marking as SMC:", err);
      alert(
        "Failed to mark user as SMC: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // Unmark user as SMC
  const unmarkAsSMC = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Not authenticated. Please login again.");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/hostel/unmark-smc`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchSMCMembers();
      await fetchBoarders();
    } catch (err) {
      console.error("Error unmarking as SMC:", err);
      alert(
        "Failed to unmark user as SMC: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  useEffect(() => {
    if (activeTab === "caterer") {
      fetchCatererInfo();
    } else if (activeTab === "boarders") {
      fetchBoarders();
    } else if (activeTab === "subscribers") {
      fetchMessSubscribers();
    } else if (activeTab === "smc") {
      fetchSMCMembers();
    }
  }, [activeTab]);

  const tabItems = [
    { label: "Caterer Info", value: "caterer", icon: UtensilsCrossed },
    { label: "Boarders", value: "boarders", icon: Users },
    { label: "Mess Subscribers", value: "subscribers", icon: Building2 },
    { label: "Bill Management", value: "bill", icon: FileText },
    { label: "SMC Management", value: "smc", icon: UserCheck },
    { label: "Notifications", value: "notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full p-6">
        <div className="flex gap-6 w-full">
          {/* Sidebar */}
          <aside
            className={`h-screen bg-white border border-gray-100 rounded-lg shadow-sm p-3 transition-all duration-200 ${
              sidebarOpen ? "w-72" : "w-16"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {sidebarOpen && (
                  <div>
                    <h2 className="text-lg font-semibold">
                      {user?.hostel_name || "Hostel"}
                    </h2>
                    <p className="text-xs text-gray-500">Hostel Office</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => logout()}
                className="text-red-600 hover:text-red-700"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-md ${
                      activeTab === tab.value
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {activeTab === "caterer" && (
              <Card>
                <h2 className="text-2xl font-bold mb-4">Caterer Information</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : catererInfo ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Caterer Name</p>
                      <p className="text-lg font-semibold">
                        {catererInfo.catererName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hostel Name</p>
                      <p className="text-lg font-semibold">
                        {catererInfo.hostelName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No caterer assigned</p>
                )}
              </Card>
            )}

            {activeTab === "boarders" && (
              <Card>
                <h2 className="text-2xl font-bold mb-4">Boarders</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Name
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Roll Number
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Email
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Room Number
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Degree
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {boarders.map((boarder) => (
                          <tr key={boarder._id}>
                            <td className="border border-gray-300 px-4 py-2">
                              {boarder.name}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {boarder.rollNumber}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {boarder.email}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {boarder.roomNumber}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {boarder.degree}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {activeTab === "subscribers" && (
              <Card>
                <h2 className="text-2xl font-bold mb-4">Mess Subscribers</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Name
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Roll Number
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Current Hostel
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Subscribed Mess
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left">
                            Room Number
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {messSubscribers.map((sub) => (
                          <tr
                            key={sub._id}
                            className={
                              sub.isDifferentHostel ? "bg-yellow-50" : ""
                            }
                          >
                            <td className="border border-gray-300 px-4 py-2">
                              {sub.name}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {sub.rollNumber}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {sub.currentHostel}
                              {sub.isDifferentHostel && (
                                <span className="ml-2 text-yellow-600">⚠️</span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {sub.currentSubscribedMess}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {sub.roomNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {activeTab === "bill" && user && (
              <MessBillCalculator
                hostelId={user._id}
                hostelName={user.hostel_name}
              />
            )}

            {activeTab === "notifications" && <NotificationSender />}

            {activeTab === "smc" && (
              <Card>
                <h2 className="text-2xl font-bold mb-4">SMC Management</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Current SMC Members
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Name
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Roll Number
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Room Number
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {smcMembers.map((member) => (
                              <tr key={member._id}>
                                <td className="border border-gray-300 px-4 py-2">
                                  {member.name}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {member.rollNumber}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {member.roomNumber}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  <Button
                                    onClick={() => unmarkAsSMC(member._id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remove SMC
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        All Boarders
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Name
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Roll Number
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Room Number
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boarders
                              .filter(
                                (b) =>
                                  !smcMembers.find((smc) => smc._id === b._id)
                              )
                              .map((boarder) => (
                                <tr key={boarder._id}>
                                  <td className="border border-gray-300 px-4 py-2">
                                    {boarder.name}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    {boarder.rollNumber}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    {boarder.roomNumber}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <Button
                                      onClick={() => markAsSMC(boarder._id)}
                                      className="bg-blue-500 hover:bg-blue-600"
                                    >
                                      Mark as SMC
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
