import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

interface ComingSoonProps {
  title: string;
}

function ComingSoon({ title }: ComingSoonProps) {
  return (
    <main className="coming-soon-page">
      <div className="coming-soon-card">
        <span>ParkFlow AI</span>
        <h2>{title}</h2>
        <p>This screen will be implemented in the next development step.</p>
      </div>
    </main>
  );
}

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/analysis"
            element={<ComingSoon title="CCTV Analysis" />}
          />

          <Route
            path="/hotspots"
            element={<ComingSoon title="Hotspot Intelligence" />}
          />

          <Route
            path="/enforcement"
            element={<ComingSoon title="Enforcement Planner" />}
          />

          <Route
            path="/routes"
            element={<ComingSoon title="Patrol Routes" />}
          />

          <Route path="/reports" element={<ComingSoon title="Reports" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;