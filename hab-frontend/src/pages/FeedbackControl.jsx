import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "../apis/server";

export default function FeedbackControl() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("admin_token");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/feedback/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch settings: ${res.status}`);
      }
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError(`Error fetching settings: ${err.message}`);
    }
  }, [token]);

  async function enable() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${BACKEND_URL}/feedback/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to enable feedback: ${res.status} - ${errorText}`
        );
      }

      setSuccess("Feedback window enabled successfully!");
      await fetchSettings();
    } catch (err) {
      setError(`Error enabling feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${BACKEND_URL}/feedback/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to disable feedback: ${res.status} - ${errorText}`
        );
      }

      setSuccess("Feedback window disabled successfully!");
      await fetchSettings();
    } catch (err) {
      setError(`Error disabling feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token, fetchSettings]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mess Feedback Control</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
          Loading...
        </div>
      )}

      {settings && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  settings.isEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {settings.isEnabled ? "Open" : "Closed"}
              </span>
            </div>
            <div>
              <span className="font-semibold">Current Window:</span>
              <span className="ml-2 font-mono">
                #{settings.currentWindowNumber || 1}
              </span>
            </div>
            <div>
              <span className="font-semibold">Enabled At:</span>
              <span className="ml-2">
                {settings.enabledAt
                  ? new Date(settings.enabledAt).toLocaleString("en-IN")
                  : "-"}
              </span>
            </div>
            <div>
              <span className="font-semibold">Disabled At:</span>
              <span className="ml-2">
                {settings.disabledAt
                  ? new Date(settings.disabledAt).toLocaleString("en-IN")
                  : "-"}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Note: If not closed manually, it auto-closes 2 days after enable.
            Feedback automatically opens on 25th of every month at 9 AM IST.
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <button
          onClick={enable}
          disabled={loading || (settings && settings.isEnabled)}
          className={`px-4 py-2 text-white rounded ${
            loading || (settings && settings.isEnabled)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Processing..." : "Enable"}
        </button>
        <button
          onClick={disable}
          disabled={loading || (settings && !settings.isEnabled)}
          className={`px-4 py-2 text-white rounded ${
            loading || (settings && !settings.isEnabled)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Processing..." : "Disable"}
        </button>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
