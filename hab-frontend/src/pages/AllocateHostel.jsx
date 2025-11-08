import React, { useState } from "react";
import { Upload, Button, message, Card, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { BACKEND_URL } from "../apis/server";

const { Title, Paragraph } = Typography;

const AllocateHostel = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const uploadProps = {
    onRemove: (file) => {
      setFileList((prev) => {
        const index = prev.indexOf(file);
        const newFileList = prev.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
    },
    beforeUpload: (file) => {
      const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
      if (!isCsv) {
        message.error("Please upload a CSV file");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    accept: ".csv",
    maxCount: 1,
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Please select a CSV file first");
      return;
    }
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const formData = new FormData();
    formData.append("file", fileList[0]);

    try {
      setUploading(true);
      const { data } = await axios.post(
        `${BACKEND_URL}/hostel/alloc/upload`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // console.log(data);
      message.success(
        `Upload completed. Processed: ${data.processed}, Errors: ${data.errors}`
      );
      setFileList([]);
    } catch (e) {
      console.error(e);
      message.error("Failed to upload allocation CSV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ maxWidth: 700 }}>
        <Title level={3}>Allocate Hostel</Title>
        <Paragraph>
          Upload a CSV with columns <b>Roll Number</b> and <b>Hostel</b>. Hostel
          names must match existing hostel names.
        </Paragraph>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>Select CSV</Button>
        </Upload>
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            {uploading ? "Uploading..." : "Upload and Process"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AllocateHostel;
