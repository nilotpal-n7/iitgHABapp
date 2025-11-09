// NOTE: This file lives in `components` (lowercase).
import { NavLink } from "react-router-dom";
import { Menu } from "antd";
import {
  HomeOutlined,
  BankOutlined,
  ShopOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  UploadOutlined,
  SettingOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const [selectedKey, setSelectedKey] = useState("1");

  const navItems = [
    {
      key: "1",
      name: "Home",
      path: "/",
      icon: <HomeOutlined />,
    },
    {
      key: "2",
      name: "Hostels",
      path: "/hostels",
      icon: <BankOutlined />,
    },
    {
      key: "3",
      name: "Caterers",
      path: "/caterers",
      icon: <ShopOutlined />,
    },
    {
      key: "4",
      name: "Students",
      path: "/students",
      icon: <UserOutlined />,
    },
    {
      key: "5",
      name: "Allocate Hostel",
      path: "/allocate-hostel",
      icon: <UploadOutlined />,
    },
    {
      key: "6",
      name: "Mess Change Applications",
      path: "/mess/changeapplication",
      icon: <BarChartOutlined />,
    },
    {
      key: "7",
      name: "Profile Settings",
      path: "/profile-settings",
      icon: <SettingOutlined />,
    },
    {
      key: "8",
      name: "Feedback Control",
      path: "/feedback-control",
      icon: <BookOutlined />,
    },
    {
      key: "9",
      name: "Feedback Leaderboard",
      path: "/feedback-leaderboard",
      icon: <BarChartOutlined />,
    },
    {
      key: "10",
      name: "Send Notifications",
      path: "/notifications",
      icon: <NotificationOutlined />,
    },
  ];

  useEffect(() => {
    const currentPath = window.location.pathname;
    const mapping = {
      "/": "1",
      "/hostels": "2",
      "/caterers": "3",
      "/students": "4",
      "/allocate-hostel": "5",
      "/mess/changeapplication": "6",
      "/profile-settings": "7",
      "/feedback-control": "8",
      "/feedback-leaderboard": "9",
      "/notifications": "10",
    };
    setSelectedKey(mapping[currentPath] || "1");
  }, []);

  const handleMenuClick = (item) => {
    setSelectedKey(item.key);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "240px",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: "24px 16px",
          borderBottom: "1px solid #f0f0f0",
          textAlign: "center",
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                lineHeight: "1.2",
              }}
            >
              IIT Guwahati
            </div>
            <div style={{ fontSize: "16px", opacity: 0.9 }}>
              Hostel Affairs Board
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 0" }}>
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          style={{
            border: "none",
            background: "transparent",
          }}
          onClick={handleMenuClick}
        >
          {navItems.map((item) => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              style={{
                margin: "4px 12px",
                borderRadius: "8px",
                height: "48px",
                lineHeight: "48px",
                fontSize: "15px",
              }}
            >
              <NavLink
                to={item.path}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
                end
              >
                {item.name}
              </NavLink>
            </Menu.Item>
          ))}
        </Menu>
      </div>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #f0f0f0",
          fontSize: "12px",
          color: "#8c8c8c",
          textAlign: "center",
        }}
      >
        <div>Coding Club</div>
        <div style={{ marginTop: "4px" }}>© 2025 IIT Guwahai</div>
      </div>
    </div>
  );
};

export default Sidebar;
