import {createContext, useContext, useState } from "react";
//import {isUser} from "utils/isUser";

//Only use the context when you need the setUser method, for read only data please use the getUser API that I have put as an export in this file
export const AuthContext = createContext(null);
//

export const AuthProvider = ({children}) => {
//  const user_info = isUser();  #Add the logic for a isUser function from utils 
//  Use the user from the isUser() function instead of null when the function is implemented
//  const [user,setUser] = useState(user_info);
    const [user,setUser] = useState(null); 
    
  return (
      <AuthContext value={{user,setUser}}>
        {children}
      </AuthContext>
    )
}

export const getUser = () => {
  const {user, _throwaway } = useContext(AuthContext);
  if (user===null) {
    return null;
  }
  return user
}
