import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Trash2,
  Building2,
  Eye,
  RotateCcw,
  CheckCircle,
  Menu,
  Star,
  Trophy,
  FileText,
  QrCode,
  Download,
} from "lucide-react";

export default function MessDetails() {
  // Extract ID from URL params (assuming you have routing setup)
  const id = "your-mess-id"; // Replace with actual useParams() hook
  const navigate = (path) => console.log(`Navigate to: ${path}`); // Replace with actual useNavigate() hook

  const [mess, setMess] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    async function fetchMess() {
      try {
        const res = await axios.get(`https://hab.codingclub.in/api/mess/${id}`);
        setMess(res.data);
      } catch (error) {
        console.error("Error fetching mess:", error);
      }
    }

    fetchMess();
  }, [id]);

  useEffect(() => {
    async function fetchHostels() {
      try {
        const res = await axios.get("https://hab.codingclub.in/api/hostel/all");
        const hostels = res.data;
        setHostels(hostels.filter((hostel) => hostel.messId === null));
      } catch (error) {
        console.error("Error fetching hostels :", error);
      }
    }
    fetchHostels();
  }, []);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this mess?")) {
      try {
        const res = await axios.delete(
          `https://hab.codingclub.in/api/mess/delete/${id}`
        );
        if (res.status === 200) {
          alert("Mess deleted successfully");
          navigate("/caterers/");
        }
      } catch (error) {
        console.error("Error deleting mess:", error);
        alert("Failed to delete mess");
      }
    }
  };

  const handleHostelChange = async () => {
    console.log(mess.hostelId);
    if (!mess.hostelId) {
      try {
        console.log(hostelId);
        const res = await axios.post(
          `https://hab.codingclub.in/api/mess/reassign/${id}`,
          {
            hostelId: hostelId,
          }
        );
        if (res.status === 200) {
          alert("Hostel assigned successfully");
          navigate(0);
        }
      } catch (error) {
        console.error("Error assigning ", error);
        alert("Failed to assign hostel");
      }
    } else {
      try {
        const res = await axios.post(
          `https://hab.codingclub.in/api/mess/change-hostel/${id}`,
          {
            hostelId: hostelId,
            oldHostelId: mess.hostelId,
          }
        );
        if (res.status === 200) {
          alert("Hostel assigned successfully");
          navigate(0);
        }
      } catch (error) {
        console.error("Error assigning ", error);
        alert("Failed to assign hostel");
      }
    }
  };

  const handleMenu = () => {
    navigate(`/mess/menu/${id}`);
  };

  const handleGoBack = () => {
    navigate("/caterers/");
  };

  const hostelPage = () => {
    if (mess.hostelId) {
      navigate(`/hostel/${mess.hostelId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {mess.name}
              </h1>
              <p className="text-gray-500">Caterer Management Dashboard</p>
            </div>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hostel Assignment */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Hostel Assignment
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Current Hostel
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {mess.hostelId ? mess.hostelName : "Not assigned"}
                      </p>
                    </div>
                    {mess.hostelId && (
                      <button
                        onClick={hostelPage}
                        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <select
                    className="flex-1 px-3 py-2 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={hostelId}
                    onChange={(e) => setHostelId(e.target.value)}
                  >
                    <option value="">Select Hostel</option>
                    {hostels.map((hostel) => (
                      <option key={hostel._id} value={hostel._id}>
                        {hostel.hostel_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleHostelChange}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {mess.hostelId ? (
                      <>
                        <RotateCcw size={16} />
                        <span className="font-medium">Change</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span className="font-medium">Assign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Menu size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Menu Management
                    </h2>
                    <p className="text-sm text-gray-500">
                      View and manage daily menu items
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMenu}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Eye size={16} />
                  <span className="font-medium">View Menu</span>
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy size={24} className="text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Performance Metrics
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} className="text-yellow-600" />
                    <span className="font-medium text-gray-700">Rating</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-yellow-700">
                      {mess.rating || "N/A"}
                    </span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} className="text-purple-600" />
                    <span className="font-medium text-gray-700">Ranking</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-purple-700">
                      #{mess.ranking || "N/A"}
                    </span>
                    <span className="text-sm text-gray-500">overall</span>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={20} className="text-red-600" />
                    <span className="font-medium text-gray-700">
                      Complaints
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-red-700">
                      {mess.complaints || "0"}
                    </span>
                    <span className="text-sm text-gray-500">total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <QrCode size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">QR Code</h2>
              </div>

              <div className="text-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <img
                    src={mess.qr_img}
                    alt="QR Code"
                    className="w-full max-w-48 mx-auto rounded-lg"
                  />
                </div>

                <p className="text-sm text-gray-500">
                  Scan to access mess services and information
                </p>

                <button className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Download size={16} />
                  <a
                    href={mess.qr_img}
                    download={`QR_${mess.name}`}
                    className="font-medium"
                  >
                    Download
                  </a>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
