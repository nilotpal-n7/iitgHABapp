import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function HostelPage() {
  const { hostelId } = useParams();
  const navigate = useNavigate();

  const [unassignedMess, setUnassignedMess] = useState([]);
  const [selectedMess, setSelectedMess] = useState('');
  const [hostel, setHostel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnassignedMess = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/mess/unassigned`);
        const data = await res.json();
        setUnassignedMess(data);
      } catch (error) {
        console.error('Error fetching unassigned mess:', error);
        setError('Could not load mess data.');
      }
    };
    fetchUnassignedMess();
  }, []);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/hostel/all/${hostelId}`);
        const data = await res.json();
        setHostel(data.hostel);
      } catch (error) {
        console.error('Error fetching hostel:', error);
        setError('Could not load hostel data.');
      }
    };
    fetchHostel();
  }, [hostelId]);

  const deleteHandle = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/hostel/${hostelId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Deletion failed');
      navigate('/all-hostels');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCatererChange = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/mess/reassign/${selectedMess}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostelId: hostelId,
          oldMessId: hostel?.messId?._id,
        }),
      });

      if (!res.ok) throw new Error('Failed to reassign caterer');
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (!hostel) {
    return <div className="p-6 text-gray-600">Loading hostel...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{hostel.hostel_name}</h1>
          <button
            onClick={deleteHandle}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow"
          >
            Delete Hostel
          </button>
        </div>

        <div className="text-lg">
          <strong className="text-gray-700">Caterer:</strong>{' '}
          <span className="text-gray-900">{hostel.messId?.name || 'None Assigned'}</span>
        </div>

        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">Change Caterer</label>
          <div className="flex gap-4">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMess}
              onChange={(e) => setSelectedMess(e.target.value)}
            >
              <option value="">-- Choose a new caterer --</option>
              {unassignedMess.map((mess) => (
                <option key={mess._id} value={mess._id}>
                  {mess.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCatererChange}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
            >
              Change Caterer
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Users ({hostel.users?.length || 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {hostel.users?.map((user, index) => (
              <div
                key={index}
                className="bg-gray-100 px-3 py-2 rounded text-gray-800 text-sm font-medium"
              >
                {user.user.name}
                {user.user.degree}
                {user.user.rollNumber}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
}
