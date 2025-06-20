import { useEffect, useState } from "react";
import axios from "axios";
<<<<<<< HEAD
import { useAuth } from "../context/AuthProvider";
=======
import { useAuth } from "../context/AuthContext";
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8

export function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState("");

  useEffect(() => {
    async function fetchHostels() {
      try {
<<<<<<< HEAD
        await axios
          .get("http://localhost:8000/api/hostel/all", {
            withCredentials: true,
          })
          .then((res) => setHostels(res.data));
=======
        const res = await axios.get("http://localhost:3000/api/hostel/all");
        setHostels(res.data);
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8
      } catch (error) {
        console.error("Error fetching hostels:", error);
      }
    }
    fetchHostels();
  }, []);

  return (
<<<<<<< HEAD
    <div className="flex flex-col items-center justify-evenly bg-white rounded-2xl p-8 gap-4 h-1/2 w-1/3">
      <p className="text-4xl">HMC Login Page</p>
      <select
        className="border border-gray-300 p-2 rounded-md"
        value={selectedHostel}
        onChange={(e) => setSelectedHostel(e.target.value)}
      >
        <option value="">Select Your Hostel</option>
        {console.log(hostels)}
        {hostels.map((hostel) => (
          <option key={hostel._id} value={hostel.hostel_name}>
            {hostel.hostel_name}
          </option>
        ))}
      </select>

      <input
        placeholder="Password"
        className="border border-gray-300 rounded-md p-2 mb-4"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className={
          selectedHostel && password
            ? "bg-blue-500 hover:bg-blue-700 text-white font-bold w-1/2 py-2 px-4 rounded"
            : "bg-gray-300 text-gray-500 font-bold w-1/2 py-2 px-4 rounded"
        }
        disabled={!selectedHostel || !password}
        onClick={() => login(selectedHostel, password)}
      >
        Login
      </button>
=======
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-evenly bg-white rounded-2xl p-6 sm:p-8 gap-4 w-full max-w-lg shadow-md">
        <p className="text-2xl sm:text-3xl font-semibold">HMC Login Page</p>

        <select
          className="border border-gray-300 p-2 rounded-md w-full"
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
        >
          <option value="">Select Your Hostel</option>
          {hostels.map((hostel) => (
            <option key={hostel._id} value={hostel.hostel_name}>
              {hostel.hostel_name}
            </option>
          ))}
        </select>

        <input
          placeholder="Password"
          className="border border-gray-300 rounded-md p-2 w-full"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className={`w-full py-2 px-4 rounded font-bold transition ${
            selectedHostel && password
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!selectedHostel || !password}
          onClick={() => login(selectedHostel, password)}
        >
          Login
        </button>
      </div>
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8
    </div>
  );
}
