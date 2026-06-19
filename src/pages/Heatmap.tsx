import { useEffect, useState } from "react";
import { parkFlowApi } from "../services/api";

interface HeatmapPoint {
  lat: number;
  lng: number;
  violationType: string;
  policeStation: string;
}

function Heatmap() {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data =
          await parkFlowApi.getHeatmapData();

        setPoints(data as unknown as HeatmapPoint[]);
      } catch (error) {
        console.error(error);
      }
    };

    void loadData();
  }, []);

  return (
    <main className="page-container">
      <h1>Violation Heatmap</h1>

      <div className="dashboard-panel">
        <h3>Total Coordinates</h3>

        <h2>{points.length}</h2>

        <p>
          Heatmap integration with Leaflet can
          be added next.
        </p>
      </div>

      <div className="dashboard-panel">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Violation</th>
              <th>Police Station</th>
            </tr>
          </thead>

          <tbody>
            {points.slice(0, 50).map((point, index) => (
              <tr key={index}>
                <td>{point.lat}</td>
                <td>{point.lng}</td>
                <td>{point.violationType}</td>
                <td>{point.policeStation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Heatmap;