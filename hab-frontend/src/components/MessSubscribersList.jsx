// NOTE: Similar to HostelUsersList, but for mess subscribers data shape
import React, { useMemo, useState, useEffect } from "react";
import { Table, Input, Typography, Avatar, Empty, Badge } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Search } = Input;

/**
 * Props:
 * - hostelName: string
 * - subscribers: Array of {
 *    _id, name, rollNumber, email, phoneNumber, roomNumber,
 *    currentHostel, currentSubscribedMess, isDifferentHostel
 *   }
 */
const MessSubscribersList = ({ hostelName, subscribers }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const rows = useMemo(() => {
    if (!Array.isArray(subscribers)) return [];
    return subscribers.map((s, idx) => ({
      key: s._id || idx,
      _id: s._id,
      name: s.name || "N/A",
      rollNumber: s.rollNumber || "N/A",
      phone: s.phoneNumber || "N/A",
      // room removed from table per request; keep value in case of future use
      room: s.roomNumber || "N/A",
      // email removed from table per request
      email: s.email || "N/A",
      currentHostel: s.currentHostel || "N/A",
      currentSubscribedMess: s.currentSubscribedMess || "N/A",
      isDifferentHostel: !!s.isDifferentHostel,
    }));
  }, [subscribers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(rows);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredData(
        rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.rollNumber.toLowerCase().includes(q) ||
            (r.phone || "").toLowerCase().includes(q) ||
            (r.currentHostel || "").toLowerCase().includes(q) ||
            (r.currentSubscribedMess || "").toLowerCase().includes(q)
        )
      );
    }
  }, [rows, searchQuery]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#13c2c2", marginRight: 12 }}
          />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Roll Number",
      dataIndex: "rollNumber",
      key: "rollNumber",
      sorter: (a, b) => a.rollNumber.localeCompare(b.rollNumber),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) =>
        (a.phone || "").toString().localeCompare((b.phone || "").toString()),
    },
    // Room and Email columns removed as requested
    {
      title: "Current Hostel",
      dataIndex: "currentHostel",
      key: "currentHostel",
      sorter: (a, b) =>
        (a.currentHostel || "").localeCompare(b.currentHostel || ""),
    },
    {
      title: "Subscribed Mess",
      dataIndex: "currentSubscribedMess",
      key: "currentSubscribedMess",
      sorter: (a, b) =>
        (a.currentSubscribedMess || "").localeCompare(
          b.currentSubscribedMess || ""
        ),
      render: (text, record) =>
        record.isDifferentHostel ? <Badge color="red" text={text} /> : text,
    },
  ];

  const handleSearch = (value) => setSearchQuery(value);

  return (
    <div style={{ padding: "24px", background: "#fff", borderRadius: "8px" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={3}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          <UserOutlined style={{ marginRight: 12, color: "#13c2c2" }} />
          {hostelName} Mess Subscribers ({filteredData.length})
        </Title>
        <Search
          placeholder="Search by name, roll, phone, hostel..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 300 }}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} subscribers`,
        }}
        size="middle"
        scroll={{ x: true }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchQuery
                  ? "No subscribers match your search."
                  : "No subscribers found."
              }
            />
          ),
        }}
      />
    </div>
  );
};

export default MessSubscribersList;
