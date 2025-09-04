import { useAuth } from "../context/AuthProvider";
import React, { useState, useEffect, useCallback } from "react";
import Menu_content from "../components/Menu_content.jsx";
import axios from "axios";
import { API_BASE_URL } from "../apis"; // Assuming you have a common API base URL defined
import CreateMenuFallback from "../components/CreateMenuFallback.jsx";
import {
  Menu,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";

import MessUsersContent from "../components/MessUsersContent.jsx";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState("menu"); // 'menu' or 'users'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  console.log("Dashboard user:", user);

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [menuExists, setMenuExists] = useState(true);
  const [currentMenu, setCurrentMenu] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });
  const [timings, setTimings] = useState({
    btime_s: "",
    ltime_s: "",
    dtime_s: "",
    btime_e: "",
    ltime_e: "",
    dtime_e: "",
  });

  const isActive = (stime, etime) => {
    const now = new Date();

    const [shours, sminutes] = stime.split(":").map(Number);
    const [ehours, eminutes] = etime.split(":").map(Number);
    const s_time = new Date(now);
    s_time.setHours(shours, sminutes, 0, 0);
    const e_time = new Date(now);
    e_time.setHours(ehours, eminutes, 0, 0);

    console.log(s_time);

    if (now >= s_time && now < e_time) return true;
    else return false;
  };

  const [activeTab, setActiveTab] = useState(() => {
    let initialDay = new Date().getDay();
    return initialDay === 0 ? 6 : initialDay - 1;
  });
  const [isLoading, setIsLoading] = useState(true);

  console.log("User:", user);

  // if(user === null) {
  //   console.log("User is null");
  // }
  // else {
  //   console.log("User is not null");
  // }

  const fetchMess = useCallback(async () => {
    console.log("Fetching mess for user:", user);
    if (!user?.messId) {
      console.log("User or Mess ID not available, skipping fetchMess.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        `Fetching menu for Mess ID: ${user?.messId?._id}, Day: ${days[activeTab]}`
      );
      const response = await axios.post(
        `${API_BASE_URL}/mess/menu/admin/${user?.messId?._id}`,
        { day: days[activeTab] }, // Data for the request body
        { withCredentials: true } // Axios option for cookies/credentials
      );

      if (response.data === "DoesntExist") {
        console.log("No menu exists for this day.");
        // Menu doesn't exist yet; show create CTA inside Menu_content
        setMenuExists(false);
        setShowCreateMenu(false);
        setCurrentMenu({ breakfast: [], lunch: [], dinner: [] });
      } else {
        setMenuExists(true);
        setShowCreateMenu(false);

        const menuData = {
          breakfast: [],
          lunch: [],
          dinner: [],
          id: response.data._id, // Store the menu ID for later use
        };

        const timeData = {
          btime_s: "",
          ltime_s: "",
          dtime_s: "",
          btime_e: "",
          ltime_e: "",
          dtime_e: "",
        };

        response.data.forEach((element) => {
          if (element.type === "Breakfast") {
            timeData.btime_s = element.startTime;
            timeData.btime_e = element.endTime;
            element.items.forEach((item) => {
              menuData.breakfast.push({
                id: item._id,
                name: item.name,
                category: item.type,
              });
            });
          } else if (element.type === "Lunch") {
            timeData.ltime_s = element.startTime;
            timeData.ltime_e = element.endTime;
            element.items.forEach((item) => {
              menuData.lunch.push({
                id: item._id,
                name: item.name,
                category: item.type,
              });
            });
          } else if (element.type === "Dinner") {
            timeData.dtime_s = element.startTime;
            timeData.dtime_e = element.endTime;
            element.items.forEach((item) => {
              menuData.dinner.push({
                id: item._id,
                name: item.name,
                category: item.type,
              });
            });
          }
        });

        console.log("Setting menu for", days[activeTab], menuData);
        setCurrentMenu(menuData);
        console.log("timeData", timeData);
        setTimings(timeData);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      setShowCreateMenu(true);
      setCurrentMenu({ breakfast: [], lunch: [], dinner: [] });
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchMess();
  }, [fetchMess]);

  const handleSuccessfulMenuCreation = () => {
    console.log(
      "CreateMenuFallback signaled success. Re-fetching menu data..."
    );
    setShowCreateMenu(false);
    fetchMess();
  };

  const handleSuccessfulMenuItemCreation = () => {
    console.log(
      "CreateMenuFallback signaled success. Re-fetching menu data..."
    );
    fetchMess();
  };

  const handleGoToCreateMenu = () => {
    setShowCreateMenu(true);
  };

  const downloadMenu = async () => {
    if (!user?.messId?._id) {
      alert("Mess ID not available");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/mess/menu/download`, {
        params: { day: days[activeTab], messId: user?.messId?._id },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disposition = response.headers["content-disposition"];
      let filename = `menu-${days[activeTab]}.pdf`;
      if (disposition) {
        const match = disposition.match(/filename=?"?([^";]+)"?/);
        if (match) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download menu:", error);
      alert(error.response?.data?.message || "Failed to download menu");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full p-6">
        <div className="flex gap-6 w-full">
          {/* Sidebar (collapsible) */}
          <aside
            className={`bg-white border border-gray-100 rounded-lg shadow-sm p-3 transition-all duration-200 ${
              sidebarOpen ? "w-72" : "w-16"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title="Toggle sidebar"
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
                      {user?.hostel_name || "HMC"}
                    </h2>
                    <p className="text-xs text-gray-500">Admin Dashboard</p>
                  </div>
                )}
              </div>
              {sidebarOpen ? (
                <button
                  onClick={() => logout()}
                  className="text-sm text-red-600"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => logout()}
                  className="text-red-600"
                  title="Logout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 10a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => setCurrentPage("menu")}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md ${
                  currentPage === "menu"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Menu className="w-5 h-5" />
                {sidebarOpen && <span>Menu Management</span>}
              </button>

              <button
                onClick={() => setCurrentPage("users")}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md ${
                  currentPage === "users"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-5 h-5" />
                {sidebarOpen && <span>Mess Users</span>}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 w-full">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    {days[activeTab]} overview
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {currentPage === "menu" && (
                    <Button onClick={downloadMenu}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="mt-6">
              {currentPage === "menu" ? (
                <div>
                  <div className="bg-white border-b border-gray-200 overflow-x-auto rounded-md w-full">
                    <div className="flex justify-between items-center px-4 py-3">
                      <Tabs
                        items={days.map((d, i) => ({ label: d, value: i }))}
                        value={activeTab}
                        onChange={(val) => setActiveTab(val)}
                      />
                      {/* Download button removed from day-selection tab; overview Download button remains */}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mt-4">
                      <div>
                        {showCreateMenu ? (
                          <div className="p-6 bg-white rounded-md">
                            <CreateMenuFallback
                              onSuccessfulCreation={
                                handleSuccessfulMenuCreation
                              }
                              activeDay={days[activeTab]}
                            />
                          </div>
                        ) : isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            <span className="ml-3 text-gray-600 text-lg">
                              Loading menu...
                            </span>
                          </div>
                        ) : (
                          <div className="w-full">
                            <Menu_content
                              key={activeTab}
                              day={days[activeTab]}
                              breakfast={currentMenu.breakfast}
                              lunch={currentMenu.lunch}
                              dinner={currentMenu.dinner}
                              messId={user?.messId?._id}
                              timeData={timings}
                              onSuccessfulItemCreation={
                                handleSuccessfulMenuItemCreation
                              }
                              click={handleGoToCreateMenu}
                              menuExists={menuExists}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Card>
                    <h3 className="text-xl font-semibold">Mess Users</h3>
                  </Card>
                  <div className="mt-4 bg-white rounded-md p-4">
                    <MessUsersContent />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
