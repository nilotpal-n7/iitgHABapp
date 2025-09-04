import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Typography, Input, Space, Tag } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { getAllMesses } from "../apis/mess";

const { Title } = Typography;
const { Search } = Input;

export default function Caterers() {
  const [messes, setMesses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchMesses = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesses();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(messes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = messes.filter(
        (item) =>
          item.caterer_name.toLowerCase().includes(query) ||
          item.hostel_name.toLowerCase().includes(query)
      );
      setFilteredData(filtered);
    }
  }, [messes, searchQuery]);

  const columns = [
    {
      title: "Caterer Name",
      dataIndex: "caterer_name",
      key: "caterer_name",
      sorter: (a, b) => a.caterer_name.localeCompare(b.caterer_name),
      render: (text) => (
        <span style={{ fontWeight: "500", fontSize: "14px" }}>{text}</span>
      ),
      width: "35%",
    },
    {
      title: "Hostel Name",
      dataIndex: "hostel_name",
      key: "hostel_name",
      sorter: (a, b) => a.hostel_name.localeCompare(b.hostel_name),
      render: (text, record) =>
        record.isAssigned ? (
          <span style={{ fontSize: "14px" }}>{text}</span>
        ) : (
          <Tag color="orange" style={{ fontSize: "12px" }}>
            {text}
          </Tag>
        ),
      width: "65%",
    },
  ];

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleRowClick = (record) => {
    navigate(`/mess/${record._id}`);
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
        {/* Header */}
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
            Caterer Management
          </Title>

          <Space>
            <Search
              placeholder="Search caterers or hostels..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={fetchMesses}
              loading={loading}
              title="Refresh caterer list"
            >
              Refresh
            </Button>
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
          <div style={{ marginBottom: "16px" }}>
            <span style={{ color: "#8c8c8c", fontSize: "14px" }}>
              Total: {filteredData.length} caterer
              {filteredData.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={false}
            size="middle"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            locale={{
              emptyText: searchQuery
                ? "No caterers found matching your search."
                : "No caterers found.",
            }}
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
