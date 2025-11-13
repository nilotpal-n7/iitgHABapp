import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Typography, Space, Tag, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getAllMesses, getMessById } from "../apis/mess";
import { BACKEND_URL } from "../apis/server";

const { Title } = Typography;
// Search removed per requirement

export default function Caterers() {
  const [messes, setMesses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingMesses, setLoadingMesses] = useState(true);
  // Search removed
  // Feedback window + leaderboard states
  const [windows, setWindows] = useState([]);
  const [selectedWindow, setSelectedWindow] = useState("");
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [loadingWindows, setLoadingWindows] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [, setError] = useState("");
  const token =
    localStorage.getItem("admin_token") || localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchMesses = async () => {
    try {
      setLoadingMesses(true);
      const data = await getAllMesses();

      // Transform data for Ant Design Table
      const transformedData = data.map((mess, index) => ({
        key: mess._id || index,
        _id: mess._id,
        caterer_name: mess.name,
        hostel_name: mess.hostelName || "No hostel assigned",
        isAssigned: !!mess.hostelName,
      }));

      setMesses(transformedData);
      setFilteredData(transformedData);
    } catch (error) {
      console.error("Error fetching messes:", error);
      setMesses([]);
      setFilteredData([]);
    } finally {
      setLoadingMesses(false);
    }
  };

  useEffect(() => {
    fetchMesses();
  }, []);

  // Fetch available feedback windows on mount
  useEffect(() => {
    (async () => {
      setLoadingWindows(true);
      setError("");
      try {
        const res = await fetch(`${BACKEND_URL}/feedback/windows`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data = [];
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("[Caterers] windows JSON parse error", e);
        }
        if (Array.isArray(data) && data.length > 0) {
          setWindows(data);
          setSelectedWindow(data[0]);
        } else {
          setWindows([]);
        }
      } catch (e) {
        console.error("[Caterers] Fetch windows error:", e);
        setWindows([]);
      } finally {
        setLoadingWindows(false);
      }
    })();
  }, [token]);

  // Fetch leaderboard when selectedWindow changes
  useEffect(() => {
    if (!selectedWindow) {
      setLeaderboardRows([]);
      return;
    }
    (async () => {
      setLoadingLeaderboard(true);
      setError("");
      try {
        const url = `${BACKEND_URL}/feedback/leaderboard-by-window?windowNumber=${selectedWindow}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        if (!res.ok) {
          setError(`Failed to fetch leaderboard: ${res.status}`);
          setLeaderboardRows([]);
          return;
        }
        let data = [];
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("[Caterers] leaderboard JSON parse error", e);
        }
        setLeaderboardRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("[Caterers] Fetch leaderboard error:", e);
        setError(String(e.message || e));
      } finally {
        setLoadingLeaderboard(false);
      }
    })();
  }, [selectedWindow, token]);

  // Merge messes with leaderboard; default sort by rank (ascending; '-' at bottom)
  useEffect(() => {
    const map = new Map(leaderboardRows.map((r) => [r.catererId, r]));
    const enriched = messes.map((m) => {
      const r = map.get(m._id);
      if (!r) {
        return {
          ...m,
          rank: "-",
          totalUsers: 0,
          smcUsers: 0,
          avgBreakfast: null,
          avgLunch: null,
          avgDinner: null,
          avgHygiene: null,
          avgWasteDisposal: null,
          avgQualityOfIngredients: null,
          avgUniformAndPunctuality: null,
          overall: null,
        };
      }
      return {
        ...m,
        rank: r.rank ?? "-",
        totalUsers: r.totalUsers ?? 0,
        smcUsers: r.smcUsers ?? 0,
        avgBreakfast: r.avgBreakfast ?? null,
        avgLunch: r.avgLunch ?? null,
        avgDinner: r.avgDinner ?? null,
        avgHygiene: r.avgHygiene ?? null,
        avgWasteDisposal: r.avgWasteDisposal ?? null,
        avgQualityOfIngredients: r.avgQualityOfIngredients ?? null,
        avgUniformAndPunctuality: r.avgUniformAndPunctuality ?? null,
        overall: r.overall ?? null,
      };
    });

    const sortByRank = (arr) => {
      return arr.slice().sort((a, b) => {
        const ra = typeof a.rank === "number" ? a.rank : parseInt(a.rank, 10);
        const rb = typeof b.rank === "number" ? b.rank : parseInt(b.rank, 10);
        const va = isNaN(ra) ? 9999 : ra;
        const vb = isNaN(rb) ? 9999 : rb;
        return va - vb;
      });
    };

    const finalData = sortByRank(enriched);
    setFilteredData(finalData);
  }, [messes, leaderboardRows]);

  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 80,
    },
    {
      title: "Caterer Name",
      dataIndex: "caterer_name",
      key: "caterer_name",
      render: (text) => (
        <span style={{ fontWeight: "500", fontSize: "14px" }}>{text}</span>
      ),
      width: 220,
    },
    {
      title: "Hostel Name",
      dataIndex: "hostel_name",
      key: "hostel_name",
      render: (text, record) =>
        record.isAssigned ? (
          <span style={{ fontSize: "14px" }}>{text}</span>
        ) : (
          <Tag color="orange" style={{ fontSize: "12px" }}>
            {text}
          </Tag>
        ),
      width: 200,
    },
    {
      title: "Users",
      dataIndex: "totalUsers",
      key: "totalUsers",
      width: 90,
    },
    {
      title: "SMC Users",
      dataIndex: "smcUsers",
      key: "smcUsers",
      width: 110,
    },
    {
      title: "Avg Breakfast",
      dataIndex: "avgBreakfast",
      key: "avgBreakfast",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 120,
    },
    {
      title: "Avg Lunch",
      dataIndex: "avgLunch",
      key: "avgLunch",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 110,
    },
    {
      title: "Avg Dinner",
      dataIndex: "avgDinner",
      key: "avgDinner",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 115,
    },
    {
      title: "Avg Hygiene (SMC)",
      dataIndex: "avgHygiene",
      key: "avgHygiene",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 150,
    },
    {
      title: "Avg Waste (SMC)",
      dataIndex: "avgWasteDisposal",
      key: "avgWasteDisposal",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 140,
    },
    {
      title: "Avg Quality (SMC)",
      dataIndex: "avgQualityOfIngredients",
      key: "avgQualityOfIngredients",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 150,
    },
    {
      title: "Avg Uniform (SMC)",
      dataIndex: "avgUniformAndPunctuality",
      key: "avgUniformAndPunctuality",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 160,
    },
    {
      title: "Overall",
      dataIndex: "overall",
      key: "overall",
      render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
      width: 110,
    },
  ];

  const handleRowClick = async (record) => {
    try {
      // Prefetch feedbacks (complaints) and pass via route state
      const details = await getMessById(record._id);
      const feedbacks = Array.isArray(details?.complaints)
        ? details.complaints
        : [];
      navigate(`/mess/${record._id}`, { state: { feedbacks } });
    } catch (e) {
      console.error(
        "Prefetch mess details failed, navigating without state",
        e
      );
      navigate(`/mess/${record._id}`);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header card restored with white background */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Caterers
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate("/create-mess")}
            >
              Add Caterer
            </Button>
          </Space>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ color: "#8c8c8c", fontSize: 14 }}>
              Total: {filteredData.length} caterer
              {filteredData.length !== 1 ? "s" : ""}
            </span>
            <Space>
              {windows.length > 0 && (
                <Select
                  value={selectedWindow}
                  size="middle"
                  onChange={(val) => setSelectedWindow(val)}
                  style={{ width: 160 }}
                  options={windows.map((w) => ({
                    value: w,
                    label: `Window #${w}`,
                  }))}
                />
              )}
              {/* Add Caterer moved to header */}
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loadingMesses || loadingWindows || loadingLeaderboard}
            pagination={false}
            size="middle"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            locale={{ emptyText: "No caterers found." }}
            style={{
              marginTop: "16px",
            }}
            rowClassName={() => "hover:bg-gray-50"}
          />
        </div>
      </div>
    </div>
  );
}
