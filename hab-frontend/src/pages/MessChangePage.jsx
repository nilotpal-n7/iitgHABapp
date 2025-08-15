import React, { useState, useEffect } from "react";
import { Users, Zap, Play, Info, XCircle } from "lucide-react";
import { BACKEND_URL } from "../apis/server";

const MessChangePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [messChangeSettings, setMessChangeSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [hostelsLoading, setHostelsLoading] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [processedRequests, setProcessedRequests] = useState([]);
  const [processedLoading, setProcessedLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/mess-change/all`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessChangeSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch(`${BACKEND_URL}/mess-change/settings`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessChangeSettings(data.data);
    } catch (error) {
      console.error("Error fetching mess change settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      setHostelsLoading(true);
      const response = await fetch(`${BACKEND_URL}/hostel/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHostels(
        Array.isArray(data) ? data : data?.hostels || data?.data || []
      );
    } catch (error) {
      console.error("Error fetching hostels:", error);
      setHostels([]);
    } finally {
      setHostelsLoading(false);
    }
  };

  const fetchProcessedRequests = async (hostelName) => {
    if (!hostelName) {
      setProcessedRequests([]);
      return;
    }
    try {
      setProcessedLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/mess-change/accepted-students/${encodeURIComponent(
          hostelName
        )}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProcessedRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching processed requests:", error);
      setProcessedRequests([]);
    } finally {
      setProcessedLoading(false);
    }
  };

  const enableMessChange = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/mess-change/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      alert("Mess change enabled successfully!");
      await fetchMessChangeSettings();
    } catch (error) {
      console.error("Error enabling mess change:", error);
      alert("Failed to enable mess change. Please try again.");
    }
  };

  const processAllRequests = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`${BACKEND_URL}/mess-change/process-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert(
        `Processing Complete!\nAccepted: ${data.acceptedUsers.length}\nRejected: ${data.rejectedUsers.length}\n\n${data.message}`
      );

      // Refresh the requests, settings and processed list (if a hostel is selected)
      await fetchRequests();
      await fetchMessChangeSettings();
      if (selectedHostel) {
        await fetchProcessedRequests(selectedHostel);
      }
    } catch (error) {
      console.error("Error processing requests:", error);
      alert("Failed to process requests. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const rejectAllRequests = async () => {
    if (!confirm("Are you sure you want to reject all pending requests?")) {
      return;
    }
    try {
      setRejecting(true);
      const response = await fetch(`${BACKEND_URL}/mess-change/reject-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message || "All pending requests rejected");
      await fetchRequests();
      await fetchMessChangeSettings();
      if (selectedHostel) {
        await fetchProcessedRequests(selectedHostel);
      }
      // Ensure UI reflects disabled state immediately
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting all requests:", error);
      alert("Failed to reject requests. Please try again.");
    } finally {
      setRejecting(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMessChangeSettings();
    fetchHostels();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      fetchProcessedRequests(selectedHostel);
    } else {
      setProcessedRequests([]);
    }
  }, [selectedHostel]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mess Change Management
        </h1>
        <p className="text-gray-600">
          Control mess change functionality and process requests for all hostels
        </p>
      </div>

      {/* Mess Change Control Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Mess Change Control
          </h2>
          {settingsLoading && (
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        {messChangeSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    messChangeSettings.isEnabled ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span
                  className={`font-semibold ${
                    messChangeSettings.isEnabled
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {messChangeSettings.isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Last Processed
              </p>
              <p className="text-sm text-gray-600">
                {messChangeSettings.lastProcessedAt
                  ? new Date(messChangeSettings.lastProcessedAt).toLocaleString(
                      "en-IN"
                    )
                  : "Never"}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!messChangeSettings?.isEnabled ? (
            <button
              onClick={enableMessChange}
              disabled={settingsLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
            >
              <Play className="w-4 h-4" />
              Enable Mess Change
            </button>
          ) : (
            <>
              <button
                onClick={processAllRequests}
                disabled={processing || requests.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
              >
                <Zap className="w-4 h-4" />
                {processing
                  ? "Processing..."
                  : `Process All Requests (${requests.length})`}
              </button>

              <button
                onClick={rejectAllRequests}
                disabled={rejecting || requests.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
              >
                <XCircle className="w-4 h-4" />
                {rejecting ? "Rejecting..." : "Reject All Requests"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pending Requests Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Requests
        </h2>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading requests...</p>
          </div>
        )}

        {!loading && requests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No pending mess change requests found
            </p>
          </div>
        ) : (
          !loading && (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sl. No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Hostel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Hostel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request, index) => (
                    <tr
                      key={request._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.hostel?.hostel_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.applied_hostel_string}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.applied_hostel_timestamp
                          ? new Date(
                              request.applied_hostel_timestamp
                            ).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Processed Requests Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Processed Requests
          </h2>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Select Hostel</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              disabled={hostelsLoading}
            >
              <option value="">-- Choose hostel --</option>
              {hostels.map((h) => (
                <option key={h._id || h.hostel_name} value={h.hostel_name}>
                  {h.hostel_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedHostel ? (
          <p className="text-gray-500">
            Choose a hostel to view processed requests.
          </p>
        ) : processedLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading processed requests...</p>
          </div>
        ) : processedRequests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No processed requests found for {selectedHostel}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sl. No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedRequests.map((item, index) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fromHostel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.toHostel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-IN")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessChangePage;
