import {
  BarChart3,
  BrainCircuit,
  Camera,
  LayoutDashboard,
  MapPinned,
  ParkingCircle,
  Route,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Heatmap",
    path: "/heatmap",
    icon: MapPinned,
  },
  {
    label: "AI Insights",
    path: "/risk-analysis",
    icon: BrainCircuit
  },
  {
    label: "CCTV Analysis",
    path: "/analysis",
    icon: Camera,
  },
  {
    label: "Hotspot Intelligence",
    path: "/hotspots",
    icon: MapPinned,
  },
  {
    label: "Enforcement Planner",
    path: "/enforcement",
    icon: ShieldCheck,
  },
  {
    label: "Patrol Routes",
    path: "/routes",
    icon: Route,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          <ParkingCircle size={28} />
        </div>

        <div>
          <h1>ParkFlow AI</h1>
          <p>Traffic Intelligence</p>
        </div>
      </div>

      <nav className="sidebar__navigation">
        <p className="sidebar__section-label">Command Centre</p>

        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__system-card">
        <div className="system-status">
          <span className="system-status__dot" />
          System Operational
        </div>

        <p>24 CCTV feeds connected</p>
        <small>Last synced just now</small>
      </div>
    </aside>
  );
}

export default Sidebar;
