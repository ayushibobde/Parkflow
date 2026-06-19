import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  Gauge,
  ParkingCircleOff,
  Radio,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import IncidentTable from "../components/IncidentTable";
import MetricCard from "../components/MetricCard";
import { incidents } from "../data/incidents";

const chartData = incidents.map((incident) => ({
  location: incident.location
    .replace("Central ", "")
    .replace("Commercial ", "")
    .replace(" Main Entrance", "")
    .replace(" Junction", "")
    .replace(" Zone", ""),
  score: incident.impactScore,
  illegalVehicles: incident.illegalVehicles,
}));

function Dashboard() {
  const criticalHotspots = incidents.filter(
    (incident) => incident.priority === "Critical",
  ).length;

  const totalIllegalVehicles = incidents.reduce(
    (total, incident) => total + incident.illegalVehicles,
    0,
  );

  const averageSpeedReduction = Math.round(
    incidents.reduce((total, incident) => {
      const reduction =
        ((incident.baselineSpeed - incident.currentSpeed) /
          incident.baselineSpeed) *
        100;

      return total + reduction;
    }, 0) / incidents.length,
  );

  const averageLaneBlockage = Math.round(
    incidents.reduce(
      (total, incident) => total + incident.laneBlockagePercent,
      0,
    ) / incidents.length,
  );

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-header__eyebrow">
            Traffic Enforcement Command Centre
          </p>

          <h2>Parking Congestion Dashboard</h2>

          <p className="dashboard-header__description">
            Monitor illegal-parking hotspots and prioritize enforcement using
            congestion-impact intelligence.
          </p>
        </div>

        <div className="dashboard-header__actions">
          <div className="live-indicator">
            <Radio size={16} />
            Live monitoring
          </div>

          <button className="primary-button" type="button">
            Analyse CCTV Feed
            <ArrowRight size={17} />
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          title="Active Incidents"
          value={incidents.filter((item) => item.status !== "Cleared").length}
          description="Currently requiring action"
          trend="+2 today"
          icon={ParkingCircleOff}
        />

        <MetricCard
          title="Critical Hotspots"
          value={criticalHotspots}
          description="Immediate enforcement required"
          trend="Priority alert"
          icon={AlertTriangle}
        />

        <MetricCard
          title="Illegal Vehicles"
          value={totalIllegalVehicles}
          description="Detected across monitored zones"
          trend="+7 this hour"
          icon={CarFront}
        />

        <MetricCard
          title="Average Speed Loss"
          value={`${averageSpeedReduction}%`}
          description={`${averageLaneBlockage}% average lane blockage`}
          trend="Across hotspots"
          icon={Gauge}
        />
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-panel--chart">
          <div className="panel-header">
            <div>
              <h3>Congestion Impact by Location</h3>
              <p>AI-generated impact score from 0 to 100</p>
            </div>

            <select className="dashboard-select" defaultValue="today">
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="location"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />

                <Bar
                  dataKey="score"
                  name="Impact Score"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Enforcement Priority</h3>
              <p>Recommended actions for highest-impact zones</p>
            </div>
          </div>

          <div className="priority-list">
            {incidents.slice(0, 3).map((incident, index) => (
              <div className="priority-list__item" key={incident.id}>
                <div className="priority-list__rank">{index + 1}</div>

                <div className="priority-list__content">
                  <div className="priority-list__heading">
                    <strong>{incident.location}</strong>
                    <span>{incident.impactScore}</span>
                  </div>

                  <p>
                    {incident.illegalVehicles} illegally parked vehicles ·{" "}
                    {incident.laneBlockagePercent}% lane blockage
                  </p>

                  <div className="priority-list__recommendation">
                    {incident.priority === "Critical"
                      ? "Deploy towing vehicle and 3 officers"
                      : incident.priority === "High"
                        ? "Deploy 2 enforcement officers"
                        : "Continue camera monitoring"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="secondary-button" type="button">
            Open enforcement planner
            <ArrowRight size={16} />
          </button>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h3>Recent Parking Incidents</h3>
            <p>Latest incidents detected from connected CCTV cameras</p>
          </div>

          <button className="text-button" type="button">
            View all incidents
            <ArrowRight size={16} />
          </button>
        </div>

        <IncidentTable incidents={incidents} />
      </section>
    </main>
  );
}

export default Dashboard;