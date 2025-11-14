import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Typography, Space, Tag, Select, Spin } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getAllMesses, getMessById } from "../apis/mess";
import { BACKEND_URL } from "../apis/server";
import FeedbackControl from "../components/FeedbackControl";

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
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  function buildPrintableHTML(data) {
    const head = `
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Mess Ratings Report</title>
    <style>
      @page { size: landscape; margin: 15mm 20mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Roboto, Arial, Helvetica, sans-serif; 
        padding: 0; 
        color: #1f2937; 
        background: #fff;
        line-height: 1.4;
      }
      .doc-header { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        margin-bottom: 20px;
        padding-bottom: 14px;
        border-bottom: 2px solid #1e40af;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .logo { 
        height: 52px;
        width: auto;
      }
      .title-group {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .doc-title { 
        font-size: 23px; 
        font-weight: 700; 
        color: #1e40af;
        letter-spacing: -0.025em;
      }
      .doc-subtitle { 
        color: #6b7280; 
        font-size: 12px;
        font-weight: 500;
      }
      .doc-meta { 
        text-align: right; 
        color: #6b7280; 
        font-size: 10.5px;
        line-height: 1.6;
      }
      .meta-label {
        font-weight: 600;
        color: #374151;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 10.5px; 
        margin-top: 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      th, td { 
        border: 1px solid #d1d5db; 
        padding: 7px 9px; 
        text-align: left; 
        vertical-align: middle;
      }
      thead th { 
        background: linear-gradient(180deg, #dbeafe, #bfdbfe); 
        color: #1e40af; 
        font-weight: 700;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        padding: 8px 9px;
      }
      tbody tr:nth-child(odd) { background: #ffffff; }
      tbody tr:nth-child(even) { background: #f9fafb; }
      tbody tr:hover { background: #f3f4f6; }
      .center { text-align: center; }
      .rank-cell {
        font-weight: 700;
        color: #1e40af;
        font-size: 11.5px;
      }
      .caterer-cell {
        font-weight: 600;
        color: #111827;
        font-size: 10.5px;
      }
      .rating-cell {
        font-weight: 600;
        color: #059669;
        font-size: 10.5px;
      }
      .footer {
        margin-top: 16px;
        padding-top: 11px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 9.5px;
        color: #9ca3af;
      }
    </style>
  </head>
  <body>
    <div class="doc-header">
      <div class="header-left">
        <img src="/handlogo.png" class="logo" alt="IIT Guwahati Logo" onerror="this.style.display='none'" />
        <div class="title-group">
          <div class="doc-title">Mess Caterer Performance Report</div>
          <div class="doc-subtitle">Hostel Affairs Board | IIT Guwahati</div>
        </div>
      </div>
      <div class="doc-meta">
        <div><span class="meta-label">Generated:</span> ${new Date().toLocaleString(
          "en-IN",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        )}</div>
        <div><span class="meta-label">Total Caterers:</span> ${
          data.length
        }</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px" class="center">Rank</th>
          <th style="width:180px">Caterer Name</th>
          <th style="width:140px">Hostel</th>
          <th style="width:70px" class="center">Feedbacks</th>
          <th style="width:70px" class="center">SMC</th>
          <th style="width:70px" class="center">Breakfast</th>
          <th style="width:70px" class="center">Lunch</th>
          <th style="width:70px" class="center">Dinner</th>
          <th style="width:70px" class="center">Hygiene</th>
          <th style="width:70px" class="center">Waste</th>
          <th style="width:70px" class="center">Quality</th>
          <th style="width:70px" class="center">Uniform</th>
          <th style="width:80px" class="center">OPI</th>
        </tr>
      </thead>
      <tbody>
  `;

    const rows = data
      .map(
        (r) => `
    <tr>
      <td class="center rank-cell">${r.rank ?? "-"}</td>
      <td class="caterer-cell">${r.caterer_name ?? "-"}</td>
      <td>${r.hostel_name ?? "-"}</td>
      <td class="center">${r.totalUsers ?? 0}</td>
      <td class="center">${r.smcUsers ?? 0}</td>
      <td class="center">${
        r.avgBreakfast == null ? "-" : Number(r.avgBreakfast).toFixed(2)
      }</td>
      <td class="center">${
        r.avgLunch == null ? "-" : Number(r.avgLunch).toFixed(2)
      }</td>
      <td class="center">${
        r.avgDinner == null ? "-" : Number(r.avgDinner).toFixed(2)
      }</td>
      <td class="center">${
        r.avgHygiene == null ? "-" : Number(r.avgHygiene).toFixed(2)
      }</td>
      <td class="center">${
        r.avgWasteDisposal == null ? "-" : Number(r.avgWasteDisposal).toFixed(2)
      }</td>
      <td class="center">${
        r.avgQualityOfIngredients == null
          ? "-"
          : Number(r.avgQualityOfIngredients).toFixed(2)
      }</td>
      <td class="center">${
        r.avgUniformAndPunctuality == null
          ? "-"
          : Number(r.avgUniformAndPunctuality).toFixed(2)
      }</td>
      <td class="center rating-cell">${
        r.overall == null ? "-" : Number(r.overall).toFixed(2)
      }</td>
    </tr>
  `
      )
      .join("");

    const foot = `
    </tbody>
  </table>
  <div class="footer">
    This is an official document generated by the Hostel Affairs Board, IIT Guwahati. 
    For queries, please contact the HAB office.
  </div>
</body>
</html>
`;

    return head + rows + foot;
  }

  function handleDownloadPDF(data) {
    try {
      setGeneratingPDF(true);
      const html = buildPrintableHTML(data);

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "1400px";
      container.style.background = "white";
      container.innerHTML = html;
      document.body.appendChild(container);

      html2canvas(container, { scale: 2, useCORS: true })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");

          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          // ---- MARGINS ----
          const marginLeft = 30;
          const marginTop = 25;
          const marginRight = 30;
          const marginBottom = 25;

          const usableWidth = pdfWidth - marginLeft - marginRight;
          const scaledWidth = usableWidth;
          const scaledHeight = (canvas.height * scaledWidth) / canvas.width;

          // Add first page
          pdf.addImage(
            imgData,
            "PNG",
            marginLeft,
            marginTop,
            scaledWidth,
            scaledHeight
          );

          // Additional pages
          if (scaledHeight > pdfHeight - marginTop - marginBottom) {
            let remainingHeight =
              scaledHeight - (pdfHeight - marginTop - marginBottom);
            let page = 1;
            while (remainingHeight > 0) {
              pdf.addPage();
              pdf.addImage(
                imgData,
                "PNG",
                marginLeft,
                marginTop - page * pdfHeight,
                scaledWidth,
                scaledHeight
              );
              remainingHeight -= pdfHeight;
              page++;
            }
          }

          pdf.save("mess-ratings.pdf");
        })
        .finally(() => {
          container.remove();
          setGeneratingPDF(false);
        });
    } catch (e) {
      console.error(e);
      setGeneratingPDF(false);
    }
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {generatingPDF && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#374151" }}>
              Preparing PDF...
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header card restored with white background and subtle border to match other frontends */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
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
            {/* Icon-only download button: opens printable landscape view of the full rating table */}
            <Button
              type="default"
              shape="circle"
              icon={<DownloadOutlined />}
              size="large"
              title="Download ratings as PDF"
              onClick={() => handleDownloadPDF(filteredData)}
            />
          </Space>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
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
                    label: `Window ${w}`,
                  }))}
                />
              )}
            </Space>
          </div>

          {/* Compact columns to reduce visual congestion. Full metrics are available in expanded row. */}
          <Table
            columns={compactColumns}
            dataSource={filteredData}
            loading={loadingMesses || loadingWindows || loadingLeaderboard}
            pagination={false}
            size="middle"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: 12 }}>
                  {/* Top row: 3 main metrics centered */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24 }}>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Breakfast
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgBreakfast == null
                            ? "-"
                            : Number(record.avgBreakfast).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Lunch
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgLunch == null
                            ? "-"
                            : Number(record.avgLunch).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Dinner
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgDinner == null
                            ? "-"
                            : Number(record.avgDinner).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 12 }} />

                  {/* Bottom row: 4 SMC metrics centered */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 24 }}>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Hygiene (SMC)
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgHygiene == null
                            ? "-"
                            : Number(record.avgHygiene).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Waste (SMC)
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgWasteDisposal == null
                            ? "-"
                            : Number(record.avgWasteDisposal).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Quality (SMC)
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgQualityOfIngredients == null
                            ? "-"
                            : Number(record.avgQualityOfIngredients).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Avg Uniform (SMC)
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {record.avgUniformAndPunctuality == null
                            ? "-"
                            : Number(record.avgUniformAndPunctuality).toFixed(
                                2
                              )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              rowExpandable: () => true,
            }}
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

        <FeedbackControl />
      </div>
    </div>
  );
}

// Compact columns definition (kept outside JSX to avoid parser issues)
const compactColumns = [
  {
    title: "Rank",
    dataIndex: "rank",
    key: "rank",
    width: 70,
  },
  {
    title: "Caterer",
    dataIndex: "caterer_name",
    key: "caterer_name",
    render: (text, record) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{text}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {record.hostel_name}
        </div>
      </div>
    ),
    width: 300,
  },
  {
    title: "Feedbacks",
    dataIndex: "totalUsers",
    key: "totalUsers",
    width: 120,
    render: (v) => (v == null ? 0 : v),
  },
  {
    title: "SMC Members",
    dataIndex: "smcUsers",
    key: "smcUsers",
    width: 120,
    render: (v) => (v == null ? 0 : v),
  },
  {
    title: "OPI Rating",
    dataIndex: "overall",
    key: "overall",
    width: 100,
    render: (v) => (v == null ? "-" : Number(v).toFixed(2)),
  },
];

// per-row download removed; printing is available via header download button which prints the full table
