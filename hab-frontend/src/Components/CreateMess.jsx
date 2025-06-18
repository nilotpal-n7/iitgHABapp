import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateMess() {
  const [caterer, setCaterer] = useState("");
  const [hostelId, setHostelId] = useState([]);
  const [hostels, setHostels] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const hostelRes = await axios.get("http://localhost:8000/api/hostel/all");
        console.log(hostelRes);
        const messRes = await axios.post("http://localhost:8000/api/mess/all");
        const messes = messRes.data;
        const assignedHostelIds = new Set(messes.map((mess) => mess.hostelId));
        const unassignedHostels = hostelRes.data.filter((hostel) => !assignedHostelIds.has(hostel._id));
        setHostels(unassignedHostels);
      } catch (error) {
        console.error("Error fetching hostels or messes:", error);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hostelId || hostelId.length === 0) {
      try {
        await axios.post(
          "http://localhost:8000/api/mess/create-without-hostel",
          {
            name: caterer,
          }
        );
        alert("Mess created successfully");
        navigate("/caterers/");
      } catch (error) {
        console.error("Error creating mess:", error);
        alert("Failed to create mess");
      }
    } else {
      try {
        await axios.post("http://localhost:8000/api/mess/create", {
          name: caterer,
          hostelId: hostelId,
        });
        alert("Mess created successfully");
        navigate("/caterers/");
      } catch (error) {
        console.error("Error creating mess:", error);
        alert("Failed to create mess");
      }
    }
  };
  

  const handleCancel = () => {
    navigate("/caterers/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create New Mess</h1>
      <input
        type="text"
        placeholder="Mess Caterer Name"
        value={caterer}
        onChange={(e) => setCaterer(e.target.value)}
        required
      />
      <br />
      <select
        value={hostelId}
        onChange={(e) => setHostelId(e.target.value)}
      >
        <option value="">Select Hostel</option>
        {hostels.map((hostel) => (
          <option key={hostel._id} value={hostel._id}>
            {hostel.name}
          </option>
        ))}
      </select>
      <br />
      <button type="submit">Create Mess</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  );
}
