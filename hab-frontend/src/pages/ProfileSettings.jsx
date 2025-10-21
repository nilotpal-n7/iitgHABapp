import { useEffect, useState } from "react";
import { Switch, Card, Typography, message } from "antd";
import {
  getProfileSettings,
  enableProfilePhotoChange,
  disableProfilePhotoChange,
} from "../apis/profile";

const { Title, Paragraph } = Typography;

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  async function fetchSettings() {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const data = await getProfileSettings(token);
      setEnabled(Boolean(data?.allowProfilePhotoChange));
    } catch (e) {
      message.error(
        `Failed to load settings: ${
          e?.response?.data?.message || e.message || e
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggle(val) {
    try {
      setLoading(true);
      setEnabled(val);
      const token = localStorage.getItem("admin_token");
      if (val) {
        await enableProfilePhotoChange(token);
      } else {
        await disableProfilePhotoChange(token);
      }
      message.success(
        val ? "Enabled profile photo change" : "Disabled profile photo change"
      );
    } catch (e) {
      setEnabled(!val);
      const msg = e?.response?.data?.message || e.message || "Failed to update";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div>
      <Title level={3}>Profile Settings</Title>
      <Paragraph type="secondary">
        Control whether students can change their profile photos in the mobile
        app.
      </Paragraph>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>Allow profile photo change</div>
            <div style={{ color: "#8c8c8c" }}>
              When enabled, the Change Profile Picture action is available to
              users.
            </div>
          </div>
          <Switch checked={enabled} loading={loading} onChange={toggle} />
        </div>
      </Card>
    </div>
  );
}
