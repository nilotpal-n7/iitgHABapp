import MessPage from "./MessPage";
import CreateMess from "./components/CreateMess";
import MessDetails from "./components/MessDetails";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MessPage />} />
        <Route path="/create-mess" element={<CreateMess />} />
        <Route path="/mess/:id" element={<MessDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
