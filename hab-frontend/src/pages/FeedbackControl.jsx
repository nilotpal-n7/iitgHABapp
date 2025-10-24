import { useEffect, useState } from "react";
import { BACKEND_URL } from "../apis/server";

export default function FeedbackControl() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const token = localStorage.getItem("admin_token");

  async function enable() {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/feedback/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      await (async () => {
        const res = await fetch(`${BACKEND_URL}/feedback/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSettings(data);
      })();
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/feedback/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      await (async () => {
        const res = await fetch(`${BACKEND_URL}/feedback/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSettings(data);
      })();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/feedback/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSettings(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mess Feedback Control</h1>
      {settings && (
        <div className="mb-4 text-sm text-gray-700">
          <div>Status: {settings.isEnabled ? "Open" : "Closed"}</div>
          <div>
            Enabled At:{" "}
            {settings.enabledAt
              ? new Date(settings.enabledAt).toLocaleString("en-IN")
              : "-"}
          </div>
          <div>
            Disabled At:{" "}
            {settings.disabledAt
              ? new Date(settings.disabledAt).toLocaleString("en-IN")
              : "-"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Note: If not closed manually, it auto-closes 2 days after enable.
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={enable}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Enable
        </button>
        <button
          onClick={disable}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Disable
        </button>
      </div>
    </div>
  );
}
