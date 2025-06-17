import React, { useEffect, useState } from 'react';

export default function HostelForm() {
  const server = import.meta.env.VITE_SERVER_URL;

  const [hostelName, setHostelName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [caterer, setCaterer] = useState('');

  const [unassignedMess, setUnassignedMess] = useState([]);

  const uploadHandle = (e) => {
    e.preventDefault();
    
    const hostelData = {
      name: hostelName,
      capacity: Number(capacity),
      caterer: caterer
    };

    console.log('Uploading hostel:', hostelData);

    // POST data to backend
    //Redirect to Hostels page
  };

  useEffect(() => {
    const fetchUnassignedMess = async () => {
      try {
        const response = await fetch(`${server}/api/mess/unassigned`);
        const data = await response.json();
        setUnassignedMess(data);
      } catch (error) {
        console.error('Failed to fetch unassigned mess:', error);
      }
    };

    fetchUnassignedMess();
  }, [server]);

  return (
    <form onSubmit={uploadHandle}>
      <div>
        <label>Hostel Name: </label>
        <input
          type="text"
          value={hostelName}
          onChange={(e) => setHostelName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Capacity: </label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Mess Caterer: </label>
        <select
          value={caterer}
          onChange={(e) => setCaterer(e.target.value)}
          required>
          <option value="">--Choose an option--</option>
          {unassignedMess.map((mess) => (
            <option key={mess._id} value={mess._id}>
              {mess.name}
            </option>
          ))}
          </select>
      </div>

      <button type="submit">Upload</button>
    </form>
  );
}
