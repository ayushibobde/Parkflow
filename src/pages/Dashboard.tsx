import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Car,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { parkFlowApi } from "../services/api";
import "./Dashboard.css";
interface DashboardData {
  totalViolations: number;
  topStation: [string, number];
  topVehicle: [string, number];
  topViolation: [string, number];
}

interface Hotspot {
  location: string;
  policeStation: string;
  latitude: string;
  longitude: string;
  violations: number;
}

function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const dashboardData =
        await parkFlowApi.getDashboardAnalytics();

      const hotspotData =
        await parkFlowApi.getHotspots();

      setDashboard(dashboardData as DashboardData);
      setHotspots(Array.isArray(hotspotData) ? hotspotData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <h2>Loading Dashboard...</h2>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>ParkFlow AI Dashboard</h1>
          <p>
            Real-time parking intelligence powered by
            violation analytics.
          </p>
        </div>

        <button onClick={() => void loadData()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="dashboard-metrics-grid">

        <article className="dashboard-metric-card">
          <AlertTriangle size={24} />
          <span>Total Violations</span>
          <strong>
            {dashboard?.totalViolations.toLocaleString()}
          </strong>
        </article>

        <article className="dashboard-metric-card">
          <Building2 size={24} />
          <span>Top Police Station</span>
          <strong>
            {dashboard?.topStation?.[0]}
          </strong>
          <small>
            {dashboard?.topStation?.[1]} violations
          </small>
        </article>

        <article className="dashboard-metric-card">
          <Car size={24} />
          <span>Top Vehicle Type</span>
          <strong>
            {dashboard?.topVehicle?.[0]}
          </strong>
          <small>
            {dashboard?.topVehicle?.[1]} violations
          </small>
        </article>

        <article className="dashboard-metric-card">
          <MapPin size={24} />
          <span>Top Violation</span>
          <strong>
            {dashboard?.topViolation?.[0]}
          </strong>
          <small>
            {dashboard?.topViolation?.[1]} records
          </small>
        </article>

      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Top 20 Parking Hotspots</h2>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Police Station</th>
                <th>Violations</th>
              </tr>
            </thead>

            <tbody>
              {hotspots.map((spot, index) => (
                <tr key={index}>
                  <td>{spot.location}</td>
                  <td>{spot.policeStation}</td>
                  <td>{spot.violations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;