import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      {user}
      <button onClick={logout}>Logout</button>
    </div>
  );
};
