import React from 'react'
import { useState, useEffect } from 'react'
import HostelItem from '../components/HostelItem'
import { useNavigate } from 'react-router-dom';

export default function AllHostelList() {
    const navigate = useNavigate();

    const server = import.meta.env.VITE_SERVER_URL;

    const [hostelList,setHostelList] = useState([
      {
        "hostelId" : 123,
        "name" : "Accha hostel",
        "catererName": "Accha caterer"
      },
      {
        "hostelId" : 456,
        "name" : "ganda hostel",
        "catererName": "ganda caterer"
      }
    ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(server);
        const response = await fetch(server+'/api/hostel/gethnc');
        const data = await response.json();

        setHostelList(data);

        console.log(data);
      } catch (error) {
        console.error("Failed to fetch hostel data:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div>
  {/* // Header */}
  <h1>ALL HOSTELS</h1>
  <button onClick={(e)=>{navigate('/create-hostel')}}>Create New</button>
  {hostelList.map((item, index) => {
     const catererName = item.messId?.name || "No caterer assigned";

    return (
      <div key={index} onClick={(e) => {console.log("navigate") 
                  navigate(`/hostel/${item.hostelId}`)}}>
        <HostelItem hostelName={item.hostel_name} messCatererName={catererName} />
      </div>
    );
  })}
</div>

  )
}
