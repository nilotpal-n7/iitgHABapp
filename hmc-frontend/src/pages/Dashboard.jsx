import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useState } from "react";
import { FaPlus } from 'react-icons/fa';
//I imported this Icon from a npm package if you have one replace and change the animations accordingly

/*Example for using linking in the app remove curly braces from this comment block when you need to implement links
<NavLink to={""} className="px-2 text-lg w-full font-semibold rounded-xs hover:bg-gray-200" >
    Home 
</NavLink>
<NavLink to={"menu"} className="px-2 w-full text-lg  font-semibold rounded-xs hover:bg-gray-200" >
     Menu
</NavLink>
*/

export const Dashboard = () => {

  const { user, logout } = useAuth();
  const [open,setOpen] = useState(false);
  return (
    <div  className="flex flex-col w-full h-screen">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-100 shadow w-full">
      <button onClick={()=> setOpen(!open)} className={`scale-200 transition-all ${open ? "rotate-45" : "rotate-0"}`}>
          <FaPlus/>
      </button>
      <h6 className="text-xl font-semibold">
          HAB Menu App
      </h6>
      </div>
      <div className="flex flex-row mt-2">
      <div
        className={`flex flex-col items-start content-start fixed left-0 h-full w-48 bg-gray-100  transform transition-transform duration-300 z-50
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button onClick={() => logout()} className="ml-2 py-1 bg-sky-600 w-42 text-center text-xl text-white rounded-xl hover:bg-red-700">
            Logout
        </button>
      </div>
      <div className={`flex-1 h-full px-2 overflow-auto transition-all duration-300 ${open ? 'ml-48' :'ml-0'}`}>
        <Outlet />
      </div>
      </div>
    </div>
  );
};

