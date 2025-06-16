import React, { useEffect, useState } from "react";
import axios from "axios";
import MessItem from "./components/MessItem";
import CreateMess from "./components/CreateMess";

export default function MessList() {
  const [messes, setMesses] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchMesses = async () => {
      try {
        const res = await axios.post(
          "http://localhost:8000/api/mess/all",
        );
        setMesses(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No messes found.");
          setMesses([]);
        } else {
          console.error("Error fetching messes:", err);
          setError("Failed to fetch mess list.");
        }
      }
    };

    fetchMesses();
  }, []);

  const handleCreateMess = (newMess) => {
    const newId = messes.length + 1;
    const Mess = {
      id: newId,
      name: newMess.name,
      caterer: newMess.caterer,
      hostel: { name: newMess.hostel },
    };
    const updatedMesses = messes.concat(Mess);
    setMesses(updatedMesses);
    setShowForm(false);
  };

  return (
    <div>
      <h1>Mess List</h1>
      {error && <p>{error}</p>}

      <ul>
        {messes.map((mess) => (
          <MessItem key={mess._id || mess.id} mess={mess} />
        ))}
      </ul>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Create New"}
      </button>

      {showForm && <CreateMess onSubmit={handleCreateMess} />}
    </div>
  );
}
