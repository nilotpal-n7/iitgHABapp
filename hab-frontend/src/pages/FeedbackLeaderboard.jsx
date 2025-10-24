import { useEffect, useState } from "react";
import { BACKEND_URL } from "../apis/server";

export default function FeedbackLeaderboard() {
  const [rows, setRows] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("admin_token");

  // Fetch available months on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/feedback/months`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          setAvailableMonths(data);
          setSelectedMonth(data[data.length - 1]); // select latest by default
        }
      } catch (e) {
        console.error("[Leaderboard] Fetch months error:", e);
      }
    })();
  }, [token]);

  // Fetch leaderboard data whenever month changes
  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const leaderUrl = `${BACKEND_URL}/feedback/leaderboard?month=${selectedMonth}`;
        console.log("[Leaderboard] Fetching:", leaderUrl);

        const res = await fetch(leaderUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        console.log("[Leaderboard] Raw response:", text);

        if (!res.ok) {
          setError(`Leaderboard failed: ${res.status}`);
          setRows([]);
          return;
        }

        let data = [];
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("[Leaderboard] JSON parse error:", e);
          setError("Invalid JSON response");
          return;
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("[Leaderboard] Fetch error:", e);
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMonth, token]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Caterer Leaderboard</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Overall = 60% non-SMC + 40% SMC
          </div>
          {availableMonths.length > 0 && (
            <select
              className="border rounded px-3 py-1 text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && error && (
        <div className="p-3 mb-4 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="p-3 mb-4 rounded bg-yellow-50 text-yellow-800 text-sm">
          No leaderboard data for {selectedMonth || "selected month"}. Ensure:
          <ul className="list-disc ml-5 mt-1">
            <li>Feedbacks were submitted during that month.</li>
            <li>Each feedback has a caterer assigned.</li>
            <li>You are logged in as HAB (admin_token present).</li>
          </ul>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left text-sm">
                <th className="p-3">Rank</th>
                <th className="p-3">Caterer</th>
                <th className="p-3">Users</th>
                <th className="p-3">SMC Users</th>
                <th className="p-3">Avg Breakfast</th>
                <th className="p-3">Avg Lunch</th>
                <th className="p-3">Avg Dinner</th>
                <th className="p-3">Avg Hygiene (SMC)</th>
                <th className="p-3">Avg Waste (SMC)</th>
                <th className="p-3">Avg Quality (SMC)</th>
                <th className="p-3">Avg Uniform (SMC)</th>
                <th className="p-3">Overall</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.catererId} className="border-t text-sm">
                  <td className="p-3 font-semibold">{r.rank}</td>
                  <td className="p-3">{r.catererName}</td>
                  <td className="p-3">{r.totalUsers}</td>
                  <td className="p-3">{r.smcUsers}</td>
                  <td className="p-3">{r.avgBreakfast?.toFixed(2)}</td>
                  <td className="p-3">{r.avgLunch?.toFixed(2)}</td>
                  <td className="p-3">{r.avgDinner?.toFixed(2)}</td>
                  <td className="p-3">
                    {r.avgHygiene == null ? "-" : r.avgHygiene.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {r.avgWasteDisposal == null
                      ? "-"
                      : r.avgWasteDisposal.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {r.avgQualityOfIngredients == null
                      ? "-"
                      : r.avgQualityOfIngredients.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {r.avgUniformAndPunctuality == null
                      ? "-"
                      : r.avgUniformAndPunctuality.toFixed(2)}
                  </td>
                  <td className="p-3 font-semibold">{r.overall?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
