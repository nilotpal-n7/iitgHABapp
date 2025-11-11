// Students.jsx (Main Component)
import React, { useState } from "react";
import { Button, Modal, message, Popconfirm } from "antd";
import StudentList from "../components/StudentList";
import { clearAllStudents } from "../apis/students";

const Students = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await clearAllStudents();
      message.success("All students cleared");
      setRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      console.error(e);
      message.error("Failed to clear students");
    } finally {
      setClearing(false);
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            background: "#fff",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1f2937",
            }}
          >
            Student Management
          </h1>

          <Popconfirm
            title="Clear all students?"
            description="This will delete all student users. This action cannot be undone."
            okText="Yes, clear"
            cancelText="Cancel"
            onConfirm={handleClearAll}
          >
            <Button
              danger
              loading={clearing}
              size="large"
              style={{ borderRadius: "6px", height: "40px", fontWeight: 500 }}
            >
              Clear All Students
            </Button>
          </Popconfirm>
        </div>

        <StudentList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Students;
