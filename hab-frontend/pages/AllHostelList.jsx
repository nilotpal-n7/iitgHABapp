import React from 'react'
import { useState, useEffect } from 'react'
import HostelItem from '../components/HostelItem'
import { useNavigate } from 'react-router-dom';

export default function AllHostelList() {
    const navigate = useNavigate();
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

useEffect(()=>{
    //Fetch the data for all the hostels
},[])
  return (
    <div>
  {/* // Header */}
  <h1>ALL HOSTELS</h1>
  <button onClick={(e)=>{navigate('/create-hostel')}}>Create New</button>
  {hostelList.map((item, index) => {
    return (
      <div key={index} onClick={(e) => {console.log("navigate") 
                  navigate(`/hostel/${item.hostelId}`)}}>
        <HostelItem hostelName={item.name} messCatererName={item.catererName} />
      </div>
    );
  })}
</div>

  )
}
