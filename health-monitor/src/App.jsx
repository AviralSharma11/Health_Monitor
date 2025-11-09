import {BrowserRouter , Routes , Route, Navigate} from "react-router-dom";
import HealthDashboard from "./Components/HealthDashboard/HealthDashboard";

function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HealthDashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
