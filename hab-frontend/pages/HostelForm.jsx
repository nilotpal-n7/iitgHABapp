import React, { useState } from 'react';

export default function HostelForm() {
  const [hostelName, setHostelName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [caterer, setCaterer] = useState('');

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
        <input
          type="text"
          value={caterer}
          onChange={(e) => setCaterer(e.target.value)}
          required
        />
      </div>

      <button type="submit">Upload</button>
    </form>
  );
}
