import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CreateMess({ onSubmit }) {
  const [caterer, setCaterer] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    async function fetchHostels() {
      try {
        const res = await axios.get("http://localhost:8000/api/hostel/all", {
          withCredentials: true,
        });
        setHostels(res.data);
      } catch (error) {
        console.error("Error fetching hostels:", error);
      }
    }

    fetchHostels();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name: caterer, hostelId }); //name=caterer
    setCaterer("");
    setHostelId("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Caterer Name"
        value={caterer}
        onChange={(e) => setCaterer(e.target.value)}
        required
      />
      <br />
      <select
        value={hostelId}
        onChange={(e) => setHostelId(e.target.value)}
        required
      >
        <option value="">Select Hostel</option>
        {hostels.map((hostel) => (
          <option key={hostel._id} value={hostel._id}>
            {hostel.hostel_name}
          </option>
        ))}
      </select>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}
