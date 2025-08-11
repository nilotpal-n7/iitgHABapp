import React, { useState, useEffect } from "react";
import { Users, Zap } from "lucide-react";
import { API_BASE_URL } from "../apis";

const RequestsContent = (props) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fcfsLoading, setFcfsLoading] = useState(false);

  const handleFCFS = async () => {
    try {
      setFcfsLoading(true);
      console.log("Processing FCFS for hostel:", props.hostelId);

      const response = await fetch(
        `${API_BASE_URL}/mess-change/accept-all/${props.hostelId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("FCFS processing completed:", data);

      alert(
        `FCFS Processing Complete!\nAccepted: ${data.acceptedUsers.length}\nRejected: ${data.rejectedUsers.length}\n\n${data.message}`
      );

      await fetchRequests();
    } catch (error) {
      console.error("Error processing FCFS:", error);
      alert("Failed to process FCFS. Please try again.");
    } finally {
      setFcfsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log("Fetching mess change requests for hostel:", props.hostelId);

      const response = await fetch(`${API_BASE_URL}/mess-change/hostel`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Requests fetched successfully:", data);

      const transformedRequests = data.data
        .filter((user) => user.applied_for_mess_changed)
        .map((user) => ({
          _id: user._id,
          name: user.name,
          rollNumber: user.rollNumber,
          fromMess: user.hostel?.hostel_name || "Unknown",
          toMess: user.applied_hostel_string,
          timestamp: user.applied_hostel_timestamp,
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setRequests(transformedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.hostelId) {
      fetchRequests();
    }
  }, [props.hostelId]);

  return (
    <div className="p-6">
      {requests.length > 0 && (
        <div className="flex justify-center mt-6 mb-6">
          <button
            onClick={handleFCFS}
            disabled={fcfsLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
          >
            <Zap className="w-5 h-5" />
            {fcfsLoading
              ? "Processing..."
              : `Process FCFS (${requests.length} requests)`}
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading requests...</p>
        </div>
      )}

      {!loading && requests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No pending requests found</p>
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
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Roll: {request.rollNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.fromMess}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.toMess}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.timestamp
                        ? new Date(request.timestamp).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
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
  );
};

export default RequestsContent;
