// NOTE: This file lives in `components` (lowercase).
import React, { useState } from "react";
import { BACKEND_URL } from "../apis/server";
import { Button, Input, Select, Checkbox } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useAuth } from "../context/useAuth";

const { TextArea } = Input;
const { Option } = Select;

const NotificationSender = () => {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topicType, setTopicType] = useState("all"); // 'all', 'specific'
  const [userType, setUserType] = useState("boarders"); // 'boarders', 'subscribers'
  const [selectedHostel, setSelectedHostel] = useState("");
  const [hostels, setHostels] = useState([]);
  const [isAlert, setIsAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch hostels for specific hostel selection
  React.useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/hostel/all`);
        const data = await response.json();
        setHostels(data);
      } catch (err) {
        console.error("Failed to fetch hostels:", err);
      }
    };
    fetchHostels();
  }, []);

  const handleSend = async () => {
    if (!title || !body) {
      alert("Please fill in title and body");
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      let topic = "";

      if (topicType === "all") {
        topic = "All_Hostels";
      } else {
        // Specific hostel
        if (!selectedHostel) {
          alert("Please select a hostel");
          return;
        }
        const hostelName = hostels
          .find((h) => h._id === selectedHostel)
          ?.hostel_name.replaceAll(" ", "_");
        topic =
          userType === "boarders"
            ? `Boarders_${hostelName}`
            : `Subscribers_${hostelName}`;
      }

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/notification/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          body,
          topic,
          isAlert,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      setSuccess(true);
      setTitle("");
      setBody("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error sending notification:", err);
      alert("Failed to send notification: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Send Notification</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Body</label>
          <TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Send To</label>
          <Select
            value={topicType}
            onChange={setTopicType}
            className="w-full mb-2"
          >
            <Option value="all">All Hostels</Option>
            <Option value="specific">Specific Hostel</Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">User Type</label>
          <Select
            value={userType}
            onChange={setUserType}
            className="w-full mb-2"
          >
            <Option value="boarders">Boarders</Option>
            <Option value="subscribers">Subscribers</Option>
          </Select>
        </div>

        {topicType === "specific" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Hostel
            </label>
            <Select
              value={selectedHostel}
              onChange={setSelectedHostel}
              className="w-full"
              placeholder="Select a hostel"
            >
              {hostels.map((hostel) => (
                <Option key={hostel._id} value={hostel._id}>
                  {hostel.hostel_name}
                </Option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Checkbox
            checked={isAlert}
            onChange={(e) => setIsAlert(e.target.checked)}
          >
            Send as Alert (urgent notification)
          </Checkbox>
        </div>

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          className="w-full"
        >
          Send Notification
        </Button>

        {success && (
          <div className="text-green-600 text-center">
            Notification sent successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSender;
