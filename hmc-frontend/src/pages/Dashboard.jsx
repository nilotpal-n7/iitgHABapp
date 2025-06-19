import { useAuth } from "../context/AuthProvider";
import React, { useState, useEffect } from "react";
import "../index.css";
import Menu_content from "../components/Menu_content.jsx";
import menuData from "../menu.js";
import axios from "axios";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
export const Dashboard = () => {
  const { user, logout } = useAuth();
  console.log("here", user);
  
  var Day = new Date().getDay(); //starts from sunday
  if (Day == 0) { Day = 6; }
  else { Day -= 1; }
  
  
  const [currentMenu, setCurrentMenu] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });
  
  const [activeTab, setActiveTab] = useState(Day);
  const [isLoading, setIsLoading] = useState(true);

  const handleModify = () => {
    alert(
      `Modify menu for ${days[activeTab]} - This would open the modification form`
    );
  };

  useEffect(() => {
    console.log("currentMenu changed to", currentMenu);
  }, [currentMenu]);

  useEffect(() => {
    async function fetchMess() {
      try {
        setIsLoading(true);
        const response = await axios.post(`http://localhost:8000/api/mess/menu/admin/${user.messId}`, {
          withCredentials: true,
          day: days[activeTab],
        });
        
        console.log("printing menu for", days[activeTab], response.data);
        
        const menuData = {
          breakfast: [],
          lunch: [],
          dinner: [],
        };
        
        response.data.forEach(element => {
          if (element.type === 'Breakfast') {
            element.items.forEach(item => {
              menuData.breakfast.push({
                id: item._id,
                name: item.name,
                category: item.type
              });
            });
          }
          else if (element.type === 'Lunch') {
            element.items.forEach(item => {
              menuData.lunch.push({
                id: item._id,
                name: item.name,
                category: item.type
              });
            });
          }
          else if (element.type === 'Dinner') {
            element.items.forEach(item => {
              menuData.dinner.push({
                id: item._id,
                name: item.name,
                category: item.type
              });
            });
          }
        });
        
        console.log("Setting menu for", days[activeTab], menuData);
        setCurrentMenu(menuData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setIsLoading(false);
      }
    }
    
    if (user?.messId) {
      fetchMess();
    }
  }, [activeTab, user?.messId, days]); // Added days to dependencies

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <div className="menu-page">
        <div className="header">
          <h1>HMC - Menu page</h1>
        </div>

        <div className="tabs-container">
          {days.map((day, index) => (
            <button
              key={day}
              className={`tab ${activeTab === index ? "active" : ""}`}
              onClick={() => setActiveTab(index)}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="day-header">
          <h2>{days[activeTab]} Menu</h2>
          {isLoading && <p>Loading menu...</p>}
        </div>
        {!isLoading && (
          <Menu_content
            key={activeTab}
            day={days[activeTab]}
            breakfast={currentMenu.breakfast}
            lunch={currentMenu.lunch}
            dinner={currentMenu.dinner}
            click={handleModify}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;