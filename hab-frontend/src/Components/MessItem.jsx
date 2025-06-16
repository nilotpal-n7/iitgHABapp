import React from "react";

export default function MessItem({ mess }) {
  return (
    <li>
      <span>{mess.name}</span> - Hostel:{" "}
      {mess.hostel ? mess.hostel.name : "Not Assigned"}
      <br />
      View Menu
      <br />
      {mess.hostel === null && (
        <>
          <button>Assign Hostel</button>
          <br />
        </>
      )}
      <button> Delete Mess</button>
    </li>
  );
}
