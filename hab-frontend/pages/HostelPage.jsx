import React from 'react'
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function HostelPage() {
    const { hostelId } = useParams();

    const [hostel, setHostel] = useState({
        "name": "Accha Hostel",
        "MessCaterer": "Accha caterer inc.",
        "users": ["Abhinav", "Shreya", "Sanjeebani"]
    })
    useEffect(() => {
        //Fetch hostel Id
        //Fetch unallocated Messes
    }, [hostelId])

    const deleteHandle = async () => {
        //Delete handle logic

    }

    const handleCatererChange = async () => {
        // Cateror change logic
    }


    return (
        <div>
            <h1>{hostel.name}</h1>
            <button onClick={deleteHandle}>Delete Hostel</button>
            <div>Cateror: {hostel.MessCaterer}
                <div>
                    Change Cateror:
                    <select>
                        <option value="">--Choose an option--</option>
                        <option value="a">pyaara khaana inc</option>
                        <option value="b">accha khaana inc</option>
                        <option value="c">tasty khaana inc</option>
                    </select>
                    <button onClick={handleCatererChange}>Change Caterer</button>
                </div>
            </div>

            <div>
                Users: {hostel.users.length}
                {hostel.users.map((user, index) => {
                    return (
                       <div> { user } </div>
                    )
                }
                )
                }
            </div>

        </div>
    )
}
