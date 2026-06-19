import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Hotspots from "./pages/Hotspots";
import Enforcement from "./pages/Enforcement";
import PatrolRoutes from "./pages/PatrolRoutes";
import Reports from "./pages/Reports";
import Heatmap from "./pages/Heatmap";
import RiskAnalysis from "./pages/RiskAnalysis";

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/analysis"
            element={<Analysis />} />

          <Route
            path="/hotspots"
            element={<Hotspots />}
          />

          <Route
            path="/enforcement"
            element={<Enforcement/>}
          />

          <Route
            path="/routes"
            element={<PatrolRoutes/>}
          />

          <Route path="/reports" element={<Reports/>}
          />
          <Route
    path="/heatmap"
    element={<Heatmap />}
  />

  <Route
    path="/risk-analysis"
    element={<RiskAnalysis />}
  />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;