import { useEffect, useState } from "react";
import { parkFlowApi } from "../services/api";

interface Hotspot {
  location: string;
  violations: number;
  policeStation: string;
}

function RiskAnalysis() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data =
        await parkFlowApi.getHotspots();

      setHotspots(data as Hotspot[]);
    };

    void loadData();
  }, []);

  const calculateRisk = (violations: number) => {
    if (violations > 500) {
      return {
        score: 95,
        priority: "Critical",
        officers: 5,
      };
    }

    if (violations > 250) {
      return {
        score: 75,
        priority: "High",
        officers: 3,
      };
    }

    return {
      score: 50,
      priority: "Medium",
      officers: 2,
    };
  };

  return (
    <main className="page-container">
      <h1>AI Risk Analysis</h1>

      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Violations</th>
              <th>Risk Score</th>
              <th>Priority</th>
              <th>Recommended Officers</th>
            </tr>
          </thead>

          <tbody>
            {hotspots.map((spot, index) => {
              const risk = calculateRisk(
                spot.violations
              );

              return (
                <tr key={index}>
                  <td>{spot.location}</td>
                  <td>{spot.violations}</td>
                  <td>{risk.score}</td>
                  <td>{risk.priority}</td>
                  <td>{risk.officers}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default RiskAnalysis;