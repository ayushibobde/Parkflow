import { ArrowUpRight } from "lucide-react";
import type { Incident } from "../types/incident";
import PriorityBadge from "./PriorityBadge";

interface IncidentTableProps {
  incidents: Incident[];
}

function IncidentTable({ incidents }: IncidentTableProps) {
  const getStatusClass = (status: Incident["status"]) => {
    return `status status--${status.toLowerCase().replace(" ", "-")}`;
  };

  return (
    <div className="table-wrapper">
      <table className="incident-table">
        <thead>
          <tr>
            <th>Incident</th>
            <th>Location</th>
            <th>Illegal Vehicles</th>
            <th>Lane Blockage</th>
            <th>Impact Score</th>
            <th>Priority</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <div className="incident-id-cell">
                  <strong>{incident.id}</strong>
                  <span>{incident.detectedAt}</span>
                </div>
              </td>

              <td>
                <div className="location-cell">
                  <strong>{incident.location}</strong>
                  <span>{incident.cameraId}</span>
                </div>
              </td>

              <td>{incident.illegalVehicles}</td>

              <td>{incident.laneBlockagePercent}%</td>

              <td>
                <div className="impact-score-cell">
                  <strong>{incident.impactScore}</strong>

                  <div className="impact-score-bar">
                    <span
                      style={{
                        width: `${incident.impactScore}%`,
                      }}
                    />
                  </div>
                </div>
              </td>

              <td>
                <PriorityBadge priority={incident.priority} />
              </td>

              <td>
                <span className={getStatusClass(incident.status)}>
                  {incident.status}
                </span>
              </td>

              <td>
                <button
                  className="table-action-button"
                  type="button"
                  aria-label={`View ${incident.id}`}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentTable;
