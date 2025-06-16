import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function MessDetails() {
  const { id } = useParams();
  //console.log("Mess ID from URL:", id);
  const [mess, setMess] = useState("");

  useEffect(() => {
    async function fetchMess() {
      try {
        const res = await axios.get(`http://localhost:8000/api/mess/${id}`);
        setMess(res.data);

      } catch (error) {
        console.error("Error fetching mess:", error);
      }
    }

    fetchMess();
  }, [id]);
  if(mess === null){
    return(
      <span> failed to load</span>
    )
  };


  return (
    <div>
      <h1>Mess Details</h1>
      <div>
        <span>Name: {mess.name}</span>
      </div>
      <div>
        <span>Hostel: {mess.hostelName}</span>
      </div>
      <div>
        <span>Rating: {mess.rating}</span>
      </div>
      <div>
        <span>Ranking: {mess.ranking}</span>
      </div>
      <div>
        <span>Complaints: {mess.complaints}</span>
      </div>
    </div>
  );
}
