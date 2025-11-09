// NOTE: This file lives in `components` (lowercase).
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Eye,
  Menu,
  Star,
  Trophy,
  FileText,
  QrCode,
  Download,
  AlertCircle,
} from "lucide-react";
import { getMessById, deleteMess } from "../apis/mess";

export default function MessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMess() {
      if (!id) {
        setError("Invalid mess ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getMessById(id);
        setMess(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching mess:", error);
        setError("Failed to load mess details. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchMess();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this mess?")) {
      return;
    }

    try {
      await deleteMess(id);
      navigate("/caterers/");
    } catch (error) {
      console.error("Error deleting mess:", error);
      setError("Failed to delete mess. Please try again.");
    }
  };

  const handleGoBack = () => {
    navigate("/caterers/");
  };

  const handleMenu = () => {
    navigate(`/mess/menu/${id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mess details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleGoBack}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No mess found
  if (!mess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mess Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested mess could not be found.
          </p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back to Caterers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

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
