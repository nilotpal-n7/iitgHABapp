// Simplified Tailwind-based sidebar aligned with SMC layout
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import {
  HomeOutlined,
  BankOutlined,
  ShopOutlined,
  UserOutlined,
  UploadOutlined,
  BarChartOutlined,
  SettingOutlined,
  BookOutlined,
  NotificationOutlined,
} from "@ant-design/icons";

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { key: "1", name: "Home", path: "/", icon: <HomeOutlined /> },
    { key: "2", name: "Hostels", path: "/hostels", icon: <BankOutlined /> },
    { key: "3", name: "Caterers", path: "/caterers", icon: <ShopOutlined /> },
    { key: "4", name: "Students", path: "/students", icon: <UserOutlined /> },
    {
      key: "5",
      name: "Mess Change Applications",
      path: "/mess/changeapplication",
      icon: <BarChartOutlined />,
    },
    {
      key: "6",
      name: "Feedback Control",
      path: "/feedback-control",
      icon: <BookOutlined />,
    },
    {
      key: "7",
      name: "Send Notifications",
      path: "/notifications",
      icon: <NotificationOutlined />,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-4 border-b border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold leading-tight">IIT Guwahati</div>
          <div className="text-sm text-gray-500">Hostel Affairs Board</div>
        </div>
      </div>

      <nav className="flex-1 py-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 w-full px-3 py-2 rounded-md mx-1 text-sm ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-md py-2 text-sm transition-colors"
        >
          Logout
        </button>
      </div>
      <div className="px-3 pb-4 text-center text-xs text-gray-500">
        <div>Coding Club</div>
        <div className="mt-1">© 2025 IIT Guwahai</div>
      </div>
    </div>
  );
};

export default Sidebar;
