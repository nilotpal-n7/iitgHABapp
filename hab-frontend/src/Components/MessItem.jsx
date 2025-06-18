import React from "react";
import axios from "axios";
import { Link  } from "react-router-dom";

export default function MessItem({ mess, del }) {
  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.delete(`http://localhost:8000/api/mess/delete/${mess._id}`);
      if(res.status === 200){
        alert("Mess deleted successfully");
        if(del) del(mess._id);
      } 
    }catch(error){
        console.error("Error deleting mess:", error);
        alert("Failed to delete mess")
    }
  }

  const handleNotAssigned = async (e) => {

  }
  return (
    <li>
      <span>{mess.name}</span>
      <br />
      <span>Hostel: {(!mess.hostelName || mess.hostelName == "Unknown")? "Not Assigned" : mess.hostelName}</span>
      <br />
      <Link to={`/mess/${mess._id}`}>
        <button>View Mess Details</button>
      </Link>
      <br />
      <Link to={`/mess/menu/${mess._id}`}>
        <button>View Mess Menu</button>
      </Link>
      <br />
      <button onClick={handleDelete}>Delete Mess</button>
    </li>
  );
}
