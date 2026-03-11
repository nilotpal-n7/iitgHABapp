import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import { API_BASE_URL } from "../apis";
import axios from "axios";
import { Users, FileText, UserCheck, Building2, LogOut } from "lucide-react";
// NotificationSender and notification tab hidden for now
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import MessBillCalculator from "../components/MessBillCalculator";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("boarders");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State for different sections
  const [boarders, setBoarders] = useState([]);
  const [messSubscribers, setMessSubscribers] = useState([]);
  const [smcMembers, setSmcMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cleaners, setCleaners] = useState([]);
  const [newCleanerName, setNewCleanerName] = useState("");
  const [newCleanerSlots, setNewCleanerSlots] = useState([]);

  const [smcSearch, setSmcSearch] = useState("");

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

  // Room cleaners CRUD
  const fetchCleaners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/room-cleaning/rc/cleaners`
      );
      setCleaners(response.data.cleaners || []);
    } catch (err) {
      setError(
        "Failed to fetch room cleaners: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCleaner = async () => {
    if (!newCleanerName.trim() || newCleanerSlots.length === 0) {
      alert("Please enter a name and select at least one slot.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/room-cleaning/rc/cleaners`, {
        name: newCleanerName.trim(),
        slots: newCleanerSlots,
      });
      setNewCleanerName("");
      setNewCleanerSlots([]);
      await fetchCleaners();
    } catch (err) {
      alert(
        "Failed to create cleaner: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleNewCleanerSlot = (slot) => {
    setNewCleanerSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const updateCleanerLocal = (id, updates) => {
    setCleaners((prev) =>
      prev.map((c) => (c._id === id ? { ...c, ...updates } : c))
    );
  };

  const toggleCleanerSlot = (id, slot) => {
    setCleaners((prev) =>
      prev.map((c) => {
        if (c._id !== id) return c;
        const slots = Array.isArray(c.slots) ? [...c.slots] : [];
        const idx = slots.indexOf(slot);
        if (idx >= 0) {
          slots.splice(idx, 1);
        } else {
          slots.push(slot);
        }
        return { ...c, slots };
      })
    );
  };

  const handleSaveCleaner = async (cleaner) => {
    if (!cleaner.name.trim() || !cleaner.slots || cleaner.slots.length === 0) {
      alert("Cleaner must have a name and at least one slot.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `${API_BASE_URL}/room-cleaning/rc/cleaners/${cleaner._id}`,
        {
          name: cleaner.name.trim(),
          slots: cleaner.slots,
        }
      );
      await fetchCleaners();
    } catch (err) {
      alert(
        "Failed to update cleaner: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCleaner = async (id) => {
    if (!window.confirm("Delete this cleaner? Existing bookings remain.")) {
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/room-cleaning/rc/cleaners/${id}`);
      await fetchCleaners();
    } catch (err) {
      alert(
        "Failed to delete cleaner: " +
          (err.response?.data?.message || err.message)
      );
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
    if (activeTab === "boarders") {
      fetchBoarders();
    } else if (activeTab === "subscribers") {
      fetchMessSubscribers();
    } else if (activeTab === "smc") {
      fetchSMCMembers();
    } else if (activeTab === "cleaners") {
      fetchCleaners();
    }
  }, [activeTab]);

  const tabItems = [
    { label: "Boarders", value: "boarders", icon: Users },
    { label: "Mess Subscribers", value: "subscribers", icon: Building2 },
    { label: "SMC Management", value: "smc", icon: UserCheck },
    // Room cleaning configuration for this hostel
    { label: "Room Cleaners", value: "cleaners", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full p-6">
        <div className="flex gap-6 w-full">
          {/* Sidebar */}
          <aside
            style={{
              height: "calc(100vh - 48px)",
              position: "sticky",
              top: "24px",
            }}
            className={`bg-white border border-gray-100 rounded-lg shadow-sm p-3 transition-all duration-200 ${
              sidebarOpen ? "w-72" : "w-16"
            }`}
          >
            <div
              className={`flex items-center ${
                sidebarOpen ? "justify-between" : "justify-center"
              } mb-6`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title={sidebarOpen ? "Collapse" : "Expand"}
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
            </div>

            <div className="space-y-2">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center ${
                      sidebarOpen
                        ? "gap-3 px-3 mx-1"
                        : "justify-center px-0 mx-0"
                    } w-full py-2 rounded-md ${
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
            <div
              className={
                sidebarOpen
                  ? "mt-auto px-2 pt-4 border-t border-gray-100"
                  : "mt-auto flex justify-center pt-4 border-t border-gray-100"
              }
            >
              <button
                onClick={() => logout()}
                className={
                  sidebarOpen
                    ? "w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-md py-2 text-sm transition-colors"
                    : "w-10 h-10 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                }
              >
                <LogOut className="w-5 h-5" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {activeTab === "boarders" && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Boarders</h2>
                  {boarders.length > 0 && (
                    <button
                      onClick={() => {
                        const title = "Hostel Boarders";
                        const headers = [
                          "Name",
                          "Roll Number",
                          "Email",
                          "Phone Number",
                          "Room Number",
                          "Degree",
                        ];
                        const rows = boarders.map((b) => [
                          b.name || "",
                          b.rollNumber || "",
                          b.email || "",
                          b.phoneNumber || "",
                          b.roomNumber || "",
                          b.degree || "",
                        ]);
                        const win = window.open("", "_blank");
                        if (!win) return;
                        win.document.write(`
                          <html>
                            <head>
                              <title>${title}</title>
                              <style>
                                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
                                h1 { font-size: 20px; margin-bottom: 16px; }
                                table { border-collapse: collapse; width: 100%; font-size: 12px; }
                                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                                th { background: #f3f4f6; }
                              </style>
                            </head>
                            <body>
                              <h1>${title}</h1>
                              <table>
                                <thead>
                                  <tr>${headers
                                    .map((h) => `<th>${h}</th>`)
                                    .join("")}</tr>
                                </thead>
                                <tbody>
                                  ${rows
                                    .map(
                                      (r) =>
                                        `<tr>${r
                                          .map(
                                            (c) =>
                                              `<td>${String(c || "")
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")}</td>`
                                          )
                                          .join("")}</tr>`
                                    )
                                    .join("")}
                                </tbody>
                              </table>
                            </body>
                          </html>
                        `);
                        win.document.close();
                        win.focus();
                        win.print();
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Download PDF
                    </button>
                  )}
                </div>
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
                            Phone Number
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
                              {boarder.phoneNumber}
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Mess Subscribers</h2>
                  {messSubscribers.length > 0 && (
                    <button
                      onClick={() => {
                        const title = "Mess Subscribers";
                        const headers = [
                          "Name",
                          "Roll Number",
                          "Current Hostel",
                          "Subscribed Mess",
                          "Phone Number",
                        ];
                        const rows = messSubscribers.map((s) => [
                          s.name || "",
                          s.rollNumber || "",
                          s.currentHostel || "",
                          s.currentSubscribedMess || "",
                          s.phoneNumber || "",
                        ]);
                        const win = window.open("", "_blank");
                        if (!win) return;
                        win.document.write(`
                          <html>
                            <head>
                              <title>${title}</title>
                              <style>
                                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
                                h1 { font-size: 20px; margin-bottom: 16px; }
                                table { border-collapse: collapse; width: 100%; font-size: 12px; }
                                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                                th { background: #f3f4f6; }
                              </style>
                            </head>
                            <body>
                              <h1>${title}</h1>
                              <table>
                                <thead>
                                  <tr>${headers
                                    .map((h) => `<th>${h}</th>`)
                                    .join("")}</tr>
                                </thead>
                                <tbody>
                                  ${rows
                                    .map(
                                      (r) =>
                                        `<tr>${r
                                          .map(
                                            (c) =>
                                              `<td>${String(c || "")
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")}</td>`
                                          )
                                          .join("")}</tr>`
                                    )
                                    .join("")}
                                </tbody>
                              </table>
                            </body>
                          </html>
                        `);
                        win.document.close();
                        win.focus();
                        win.print();
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Download PDF
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Caterer info summary for this mess */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Caterer
                        </div>
                        <div className="mt-1 text-base font-semibold text-gray-900">
                          {user?.hostel_name || "Hostel"} Mess
                        </div>
                      </div>
                      {Array.isArray(messSubscribers) &&
                        messSubscribers.length > 0 && (
                          <div className="flex items-center gap-6">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-gray-500">
                                Rating
                              </div>
                              <div className="mt-1 text-base font-semibold text-gray-900">
                                {messSubscribers[0].rating ?? "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-gray-500">
                                Ranking
                              </div>
                              <div className="mt-1 text-base font-semibold text-gray-900">
                                {messSubscribers[0].ranking ?? "N/A"}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>

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
                              Phone Number
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
                                  <span className="ml-2 text-yellow-600">
                                    ⚠️
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {sub.currentSubscribedMess}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {sub.phoneNumber}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {activeTab === "cleaners" && (
              <Card>
                <div className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Room Cleaners &amp; Slots
                  </h2>

                  {/* Add cleaner form */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Add New Cleaner
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
                      <input
                        type="text"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Cleaner name"
                        value={newCleanerName}
                        onChange={(e) => setNewCleanerName(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-3 items-center">
                        {["A", "B", "C", "D"].map((slot) => (
                          <label
                            key={slot}
                            className="flex items-center gap-1 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={newCleanerSlots.includes(slot)}
                              onChange={() => toggleNewCleanerSlot(slot)}
                            />
                            <span>Slot {slot}</span>
                          </label>
                        ))}
                      </div>
                      <Button onClick={handleCreateCleaner} disabled={loading}>
                        Add Cleaner
                      </Button>
                    </div>
                  </div>

                  {/* Existing cleaners table */}
                  {loading && cleaners.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : cleaners.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No cleaners configured yet. Add your first cleaner above.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-200 px-3 py-2 text-left">
                              Name
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left">
                              Slots
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cleaners.map((cleaner) => (
                            <tr key={cleaner._id}>
                              <td className="border border-gray-200 px-3 py-2 align-middle">
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                                  value={cleaner.name || ""}
                                  onChange={(e) =>
                                    updateCleanerLocal(cleaner._id, {
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="border border-gray-200 px-3 py-2 align-middle">
                                <div className="flex flex-wrap gap-2">
                                  {["A", "B", "C", "D"].map((slot) => (
                                    <label
                                      key={slot}
                                      className="flex items-center gap-1 text-xs text-gray-700"
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={
                                          Array.isArray(cleaner.slots) &&
                                          cleaner.slots.includes(slot)
                                        }
                                        onChange={() =>
                                          toggleCleanerSlot(cleaner._id, slot)
                                        }
                                      />
                                      <span>Slot {slot}</span>
                                    </label>
                                  ))}
                                </div>
                              </td>
                              <td className="border border-gray-200 px-3 py-2 align-middle text-right space-x-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => handleSaveCleaner(cleaner)}
                                  disabled={loading}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteCleaner(cleaner._id)
                                  }
                                  disabled={loading}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "smc" && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">SMC Management</h2>
                  <input
                    type="text"
                    value={smcSearch}
                    onChange={(e) => setSmcSearch(e.target.value)}
                    placeholder="Search by name or roll..."
                    className="w-64 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                            {smcMembers
                              .filter((member) => {
                                if (!smcSearch.trim()) return true;
                                const q = smcSearch.toLowerCase();
                                return (
                                  member.name?.toLowerCase().includes(q) ||
                                  member.rollNumber?.toLowerCase().includes(q)
                                );
                              })
                              .map((member) => (
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
                              .filter((b) => {
                                const notSmc = !smcMembers.find(
                                  (smc) => smc._id === b._id
                                );
                                if (!notSmc) return false;
                                if (!smcSearch.trim()) return true;
                                const q = smcSearch.toLowerCase();
                                return (
                                  b.name?.toLowerCase().includes(q) ||
                                  b.rollNumber?.toLowerCase().includes(q)
                                );
                              })
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
