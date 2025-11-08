import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HostelStats from "./stats/HostelStats";
import HostelUsersList from "../components/HostelUsersList";
import {
  getUnassignedMesses,
  assignMessToHostel,
  getMessById,
} from "../apis/mess";
import { getHostelById } from "../apis/hostel";

export default function HostelPage() {
  const { hostelId } = useParams();

  const [unassignedMess, setUnassignedMess] = useState([]);
  const [selectedMess, setSelectedMess] = useState("");
  const [hostel, setHostel] = useState(null);
  const [messDetails, setMessDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details"); // 'details' or 'bill'
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchUnassignedMess = async () => {
      try {
        const data = await getUnassignedMesses();
        setUnassignedMess(data);
      } catch (err) {
        console.error("Error fetching unassigned mess:", err);
        setError("Failed to fetch unassigned mess");
      }
    };

    fetchUnassignedMess();
  }, []);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const data = await getHostelById(hostelId);
        // console.log("Hostel data received:", data);
        setHostel(data.hostel);

        // If hostel has a mess assigned, fetch full mess details
        if (data.hostel.messId) {
          // console.log("Mess ID found:", data.hostel.messId);
          try {
            const fullMessDetails = await getMessById(data.hostel.messId._id);
            // console.log("Full mess details:", fullMessDetails);
            setMessDetails(fullMessDetails);
          } catch (messError) {
            console.error("Error fetching mess details:", messError);
            // Fallback to basic mess info from hostel data with minimal required fields
            setMessDetails({
              _id: data.hostel.messId._id,
              name: data.hostel.messId.name,
              rating: 0,
              ranking: "N/A",
              complaints: [],
            });
          }
        } else {
          // console.log("No mess assigned to hostel");
          setMessDetails(null);
        }
      } catch (err) {
        console.error("Error fetching hostel:", err);
        setError("Could not load hostel data.");
      }
    };

    fetchHostel();
  }, [hostelId]);

  const handleCatererChange = async () => {
    setIsAssigning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await assignMessToHostel(selectedMess, {
        hostelId: hostelId,
      });

      // Refresh the hostel and mess data
      const data = await getHostelById(hostelId);
      setHostel(data.hostel);

      if (data.hostel.messId) {
        const fullMessDetails = await getMessById(data.hostel.messId._id);
        setMessDetails(fullMessDetails);
      }

      // Refresh unassigned mess list
      const unassignedData = await getUnassignedMesses();
      setUnassignedMess(unassignedData);

      setSelectedMess(""); // Reset selection

      // Show success message
      setSuccessMessage("Caterer assigned successfully!");
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error assigning caterer:", err);
      setError("Failed to assign caterer.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignMess = async () => {
    // console.log("Current hostel data:", hostel);
    // console.log("Current messDetails:", messDetails);

    if (!hostel.messId) {
      setError("No caterer is currently assigned to this hostel.");
      return;
    }

    if (
      !window.confirm("Are you sure you want to unassign the current caterer?")
    ) {
      return;
    }

    setIsUnassigning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get the mess ID - it could be a string or an object with _id
      const messIdToUnassign =
        typeof hostel.messId === "object" ? hostel.messId._id : hostel.messId;
      // console.log("Unassigning mess with ID:", messIdToUnassign);

      // Refresh the hostel data
      const data = await getHostelById(hostelId);
      // console.log("Refreshed hostel data after unassign:", data);
      setHostel(data.hostel);
      setMessDetails(null);

      // Refresh unassigned mess list
      const unassignedData = await getUnassignedMesses();
      setUnassignedMess(unassignedData);

      // Show success message
      setSuccessMessage("Caterer unassigned successfully!");
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Additional verification - fetch mess details to confirm unassignment
      try {
        const messCheck = await getMessById(messIdToUnassign);
        console.log("Mess details after unassign:", messCheck);
      } catch (checkError) {
        console.log(
          "Could not fetch mess details for verification:",
          checkError
        );
      }
    } catch (err) {
      console.error("Error unassigning mess:", err);
      setError("Failed to unassign mess. Please try again.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleDelete = async () => {
    try {
      // This would need a deleteHostel API function
      // console.log("Delete hostel functionality not implemented yet");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (!hostel) {
    return <div className="p-6 text-gray-600">Loading hostel...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {hostel.hostel_name}
          </h1>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow"
          >
            Delete Hostel
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Hostel Details
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users ({hostel.users?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Hostel Stats
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="grid md:grid-cols-1 gap-6">
            {/* Mess Details */}
            {messDetails && (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Current Caterer Details
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Name:</span>
                    <span className="text-gray-900">
                      {messDetails.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Rating:</span>
                    <span className="text-yellow-600 font-semibold">
                      {messDetails.rating?.toFixed(1) || "0.0"} / 5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Ranking:</span>
                    <span className="text-gray-900">
                      {messDetails.ranking || "Not Ranked"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    Feedbacks
                  </h3>
                  {messDetails.complaints?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {messDetails.complaints.map((fb, idx) => (
                        <li key={idx}>{fb}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No feedbacks available.
                    </p>
                  )}
                </div>

                {/* Caterer Change */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 font-medium">
                      Change Caterer
                    </label>
                    <button
                      onClick={handleUnassignMess}
                      disabled={isUnassigning}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isUnassigning
                        ? "Unassigning..."
                        : "Unassign Current Caterer"}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <select
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedMess}
                      onChange={(e) => setSelectedMess(e.target.value)}
                    >
                      <option value="">-- Choose a new caterer --</option>
                      {unassignedMess.map((mess) => (
                        <option key={mess._id} value={mess._id}>
                          {mess.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCatererChange}
                      disabled={!selectedMess || isAssigning}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isAssigning ? "Changing..." : "Change"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No Mess Assigned */}
            {!messDetails && (
              <div
                className="p-4 border border-gray-200 rounded-lg bg-gray-
50 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  No Caterer Assigned
                </h2>
                <p className="text-gray-600">
                  This hostel currently has no caterer assigned.
                </p>
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-1">
                    Assign a Caterer
                  </label>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedMess}
                    onChange={(e) => setSelectedMess(e.target.value)}
                  >
                    <option value="">-- Choose a caterer --</option>
                    {unassignedMess.map((mess) => (
                      <option key={mess._id} value={mess._id}>
                        {mess.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCatererChange}
                    disabled={!selectedMess || isAssigning}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <HostelUsersList
            hostelName={hostel.hostel_name}
            users={hostel.users}
          />
        )}

        {activeTab === "stats" && messDetails && (
          <HostelStats
            hostelId={hostelId}
            hostelName={hostel.hostel_name}
            messId={messDetails._id}
          />
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-4">
            {successMessage}
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
}
