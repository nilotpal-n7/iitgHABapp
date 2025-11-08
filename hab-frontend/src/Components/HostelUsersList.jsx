// NOTE: This file lives in `components` (lowercase).
import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Typography, Avatar, Tag, Empty } from "antd";
import { UserOutlined, SearchOutlined, MailOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Search } = Input;

const HostelUsersList = ({ hostelName, users }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // Debug logging
  // console.log("HostelUsersList received users:", users);
  // console.log("Users type:", typeof users, "Is array:", Array.isArray(users));

  const processedUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    return users.map((userItem, index) => ({
      key: userItem.user._id || index,
      _id: userItem.user._id,
      name: userItem.user.name || "N/A",
      rollNumber: userItem.user.rollNumber || "N/A",
      email: userItem.user.email || "N/A",
      degree: userItem.user.degree || "N/A",
      curr_subscribed_mess_name:
        userItem.user.curr_subscribed_mess_name || "N/A",
    }));
  }, [users]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(processedUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = processedUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.rollNumber.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.degree.toLowerCase().includes(query)
      );
      setFilteredData(filtered);
    }
  }, [processedUsers, searchQuery]);

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
            style={{ backgroundColor: "#1890ff", marginRight: 12 }}
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
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <MailOutlined style={{ marginRight: 8, color: "#8c8c8c" }} />
          {text}
        </div>
      ),
    },
    {
      title: "Degree",
      dataIndex: "degree",
      key: "degree",
      sorter: (a, b) => a.degree.localeCompare(b.degree),
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Current Mess",
      dataIndex: "curr_subscribed_mess_name",
      key: "curr_subscribed_mess_name",
      sorter: (a, b) =>
        a.curr_subscribed_mess_name.localeCompare(b.curr_subscribed_mess_name),
    },
  ];

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  return (
    <div style={{ padding: "24px", background: "#fff", borderRadius: "8px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={2}
          style={{ margin: 0, display: "flex", alignItems: "center" }}
        >
          <UserOutlined style={{ marginRight: "12px", color: "#1890ff" }} />
          {hostelName} Users ({filteredData.length})
        </Title>

        <Search
          placeholder="Search by name, roll number, email..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 400 }}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} users`,
        }}
        size="middle"
        scroll={{ x: true }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchQuery
                  ? "No users found matching your search."
                  : "No users assigned to this hostel."
              }
            />
          ),
        }}
      />
    </div>
  );
};

export default HostelUsersList;
