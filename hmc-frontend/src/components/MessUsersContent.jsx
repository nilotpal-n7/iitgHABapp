import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, message, Spin, Empty } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { Users } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from "../apis";
import { useAuth } from "../context/AuthProvider";

const MessUsersContent = () => {
  const [messUsers, setMessUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { user, token, isAuthenticated, logout } = useAuth();

  // Table columns configuration
  const columns = [
    {
      title: "Sl. No",
      key: "slNo",
      width: 80,
      render: (_, __, index) => {
        const { current, pageSize } = pagination;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 240,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
    },
    {
      title: "Roll Number",
      dataIndex: "rollNumber",
      key: "rollNumber",
      width: 140,
      sorter: (a, b) => a.rollNumber.localeCompare(b.rollNumber),
      ellipsis: true,
    },
    {
      title: "Hostel",
      dataIndex: "hostel",
      key: "hostel",
      width: 200,
      sorter: (a, b) => a.hostel.localeCompare(b.hostel),
      ellipsis: true,
    },
  ];

  // Fetch mess users
  const fetchMessUsers = useCallback(
    async (page = 1, pageSize = 10) => {
      if (!token || !isAuthenticated || !user?._id) {
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          // NOTE: server route is mounted at '/api/users', so use '/users' (plural)
          `${API_BASE_URL}/users/mess-subscribers/${user._id}?page=${page}&limit=${pageSize}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.status === 401) {
          logout("Session has expired");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform the data to match our table structure
        const transformedData = (data.users || []).map((user, index) => ({
          key: user._id || index,
          name: user.name || "N/A",
          rollNumber: user.rollNumber || "N/A",
          // Show the user's own hostel (hostel membership), not the subscribed mess
          hostel: user.hostel?.hostel_name || "N/A",
          _id: user._id,
        }));

        setMessUsers(transformedData);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: data.count || transformedData.length,
        });
      } catch (error) {
        console.error("Error fetching mess users:", error);
        message.error("Failed to fetch mess users");
        setMessUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [token, isAuthenticated, user?._id, logout]
  );

  // Handle table pagination change
  const handleTableChange = (paginationConfig) => {
    const { current = 1, pageSize = 10 } = paginationConfig;
    // update local pagination state so the UI stays in sync
    setPagination((prev) => ({ ...prev, current, pageSize }));
    // fetch data for the selected page
    fetchMessUsers(current, pageSize);
  };

  // Download PDF function
  const downloadPDF = () => {
    if (messUsers.length === 0) {
      message.warning("No data available to download");
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Mess Users Report", doc.internal.pageSize.getWidth() / 2, 20, {
        align: "center",
      });

      // Add hostel name and date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Hostel: ${user?.hostel_name || "N/A"}`, 20, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

      // Prepare table data
      const tableData = messUsers.map((user, index) => [
        index + 1,
        user.name,
        user.rollNumber,
        user.hostel,
      ]);

      // Add table
      doc.autoTable({
        head: [["Sl. No", "Name", "Roll Number", "Hostel"]],
        body: tableData,
        startY: 55,
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      // Save the PDF
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split("T")[0];
      doc.save(`Mess_Users_${user?.hostel_name || "Report"}_${dateString}.pdf`);

      message.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF");
    }
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchMessUsers();
  }, [fetchMessUsers]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">
          Please log in to view mess users
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Mess Users
          </h2>
          <p className="text-gray-600">
            Students subscribed to {user?.hostel_name || "this"} mess
          </p>
        </div>

        {/* Download Button */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={downloadPDF}
          disabled={loading || messUsers.length === 0}
          className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
        >
          Download PDF
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <Table
          columns={columns}
          dataSource={messUsers}
          rowKey={(record) => record.key}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={(pag) => handleTableChange(pag)}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No mess users found"
              />
            ),
          }}
          size="middle"
          scroll={{ x: 800 }}
        />
      </div>

      {/* Summary */}
      {!loading && messUsers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Total {pagination.total} users subscribed to this mess
        </div>
      )}
    </div>
  );
};

export default MessUsersContent;
