import React, { useState } from "react";
import "./index.css";
import Menu_content from "./components/Menu_content.jsx";
import menuData from "./menu.js";

const App = () => {
  const Day = new Date().getDay();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const [activeTab, setActiveTab] = useState(Day);


  const currentMenu = menuData[activeTab] || {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  const handleModify = () => {
    alert(
      `Modify menu for ${days[activeTab]} - This would open the modification form`
    );
  };

  return (
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
      </div>
      <Menu_content
        key={activeTab}
        day={days[activeTab]}
        breakfast={currentMenu.breakfast}
        lunch={currentMenu.lunch}
        dinner={currentMenu.dinner}
        click={handleModify}
      />
    </div>
  );
};

export default App;
