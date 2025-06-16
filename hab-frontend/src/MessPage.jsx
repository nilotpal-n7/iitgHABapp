import React, { useEffect, useState } from "react";
import MessItem from "./components/MessItem";
import axios from "axios";
import { Link } from "react-router-dom";

export default function MessPage() {
  const [messes, setMesses] = useState([]);

  useEffect(() => {
    const fetchMesses = async () => {
      try {
        const res = await axios.post("http://localhost:8000/api/mess/all");
        setMesses(res.data);
      } catch (error) {
        console.error("Error fetching messes:", error);
      }
    };
    fetchMesses();
  }, []);

  return (
    <div>
      <h1>Mess List</h1>
      <ul>
        {messes.map((mess) => (
          <MessItem key={mess._id} mess={mess} />
        ))}
      </ul>
      <Link to="/create-mess">
        <button>Create New Mess</button>
      </Link>
    </div>
  );
}
