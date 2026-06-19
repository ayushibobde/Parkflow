import "leaflet/dist/leaflet.css";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gauge,
  LocateFixed,
  Navigation,
  ParkingCircle,
  Play,
  Radio,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { parkFlowApi } from "../services/api";
import type {
  PatrolRoute,
  PatrolStop,
  PatrolStopStatus,
} from "../types/patrolRoute";
import type { Priority } from "../types/incident";

interface RouteMapControllerProps {
  coordinates: [number, number][];
}

function RouteMapController({
  coordinates,
}: RouteMapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 1) {
      map.fitBounds(coordinates, {
        padding: [45, 45],
      });
    }
  }, [coordinates, map]);

  return null;
}

function getPriorityColor(priority: Priority) {
  switch (priority) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#f97316";
    case "Medium":
      return "#8b5cf6";
    case "Low":
      return "#22c55e";
    default:
      return "#2563eb";
  }
}

function getStopStatus(
  stop: PatrolStop,
  orderedStops: PatrolStop[],
  completedStopIds: string[],
  routeStarted: boolean,
): PatrolStopStatus {
  if (completedStopIds.includes(stop.id)) {
    return "Completed";
  }

  const firstIncompleteStop = orderedStops.find(
    (item) => !completedStopIds.includes(item.id),
  );

  if (
    routeStarted &&
    firstIncompleteStop &&
    firstIncompleteStop.id === stop.id
  ) {
    return "Current";
  }

  return "Pending";
}

function PatrolRoutes() {
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isOptimized, setIsOptimized] = useState(false);
  const [routeStarted, setRouteStarted] = useState(false);
  const [completedStopIds, setCompletedStopIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);

        const response = await parkFlowApi.getPatrolRoutes();
        const data =
          (response as { data?: PatrolRoute[] }).data ?? [];

        setPatrolRoutes(data);
        setSelectedRouteId(data[0]?.id ?? "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadRoutes();
  }, []);

  const selectedRoute =
    patrolRoutes.find(
      (routeItem) => routeItem.id === selectedRouteId,
    ) ?? patrolRoutes[0];

  const orderedStops = useMemo(() => {
    if (!selectedRoute) {
      return [];
    }

    return [...selectedRoute.stops].sort((first, second) => {
      if (isOptimized) {
        return first.optimizedOrder - second.optimizedOrder;
      }

      return first.originalOrder - second.originalOrder;
    });
  }, [isOptimized, selectedRoute]);

  if (loading) {
    return (
      <main className="patrol-page">
        <h2>Loading patrol routes...</h2>
      </main>
    );
  }

  if (!selectedRoute) {
    return (
      <main className="patrol-page">
        <h2>No patrol routes available from dataset.</h2>
      </main>
    );
  }

  const routeCoordinates: [number, number][] = [
    [
      selectedRoute.startLatitude,
      selectedRoute.startLongitude,
    ],
    ...orderedStops.map(
      (stop): [number, number] => [
        stop.latitude,
        stop.longitude,
      ],
    ),
  ];

  const displayedDistance = isOptimized
    ? selectedRoute.optimizedDistanceKm
    : selectedRoute.originalDistanceKm;

  const displayedDuration = isOptimized
    ? selectedRoute.optimizedDurationMinutes
    : selectedRoute.originalDurationMinutes;

  const distanceSaved =
    selectedRoute.originalDistanceKm -
    selectedRoute.optimizedDistanceKm;

  const timeSaved =
    selectedRoute.originalDurationMinutes -
    selectedRoute.optimizedDurationMinutes;

  const criticalStops = selectedRoute.stops.filter(
    (stop) => stop.priority === "Critical",
  ).length;

  const totalIllegalVehicles = selectedRoute.stops.reduce(
    (total, stop) => total + stop.illegalVehicles,
    0,
  );

  const routeCompleted =
    completedStopIds.length === orderedStops.length &&
    orderedStops.length > 0;

  const currentStop = orderedStops.find(
    (stop) => !completedStopIds.includes(stop.id),
  );

  function handleRouteChange(routeId: string) {
    setSelectedRouteId(routeId);
    setIsOptimized(false);
    setRouteStarted(false);
    setCompletedStopIds([]);
  }

  function handleOptimizeRoute() {
    setIsOptimized(true);
    setRouteStarted(false);
    setCompletedStopIds([]);
  }

  function handleStartRoute() {
    setRouteStarted(true);
  }

  function handleCompleteCurrentStop() {
    if (!currentStop) {
      return;
    }

    setCompletedStopIds((currentIds) => [
      ...currentIds,
      currentStop.id,
    ]);
  }

  function handleResetRoute() {
    setRouteStarted(false);
    setCompletedStopIds([]);
  }

  return (
    <main className="patrol-page">
      <header className="patrol-header">
        <div>
          <p className="patrol-header__eyebrow">
            AI-Assisted Field Deployment
          </p>

          <h2>Patrol Route Optimizer</h2>

          <p>
            Prioritize high-impact parking hotspots and create an
            efficient multi-stop enforcement route for field teams.
          </p>
        </div>

        <div className="patrol-header__status">
          <Radio size={16} />
          Route planning service operational
        </div>
      </header>

      <section className="patrol-controls">
        <div className="patrol-route-selector">
          <label htmlFor="patrol-route">Select patrol plan</label>

          <select
            id="patrol-route"
            value={selectedRouteId}
            onChange={(event) =>
              handleRouteChange(event.target.value)
            }
          >
            {patrolRoutes.map((routeItem) => (
              <option
                key={routeItem.id}
                value={routeItem.id}
              >
                {routeItem.name}
              </option>
            ))}
          </select>
        </div>

        <div className="patrol-team-summary">
          <Users size={18} />

          <div>
            <strong>{selectedRoute.teamName}</strong>
            <span>{selectedRoute.vehicleNumber}</span>
          </div>
        </div>

        <button
          className="patrol-optimize-button"
          type="button"
          onClick={handleOptimizeRoute}
        >
          <Sparkles size={17} />
          {isOptimized
            ? "Route optimized"
            : "Optimize patrol route"}
        </button>
      </section>

      <section className="patrol-metrics-grid">
        <article className="patrol-metric-card">
          <div className="patrol-metric-card__icon">
            <Route size={20} />
          </div>

          <div>
            <span>Route distance</span>
            <strong>{displayedDistance.toFixed(1)} km</strong>
            <small>
              {isOptimized
                ? `${distanceSaved.toFixed(1)} km saved`
                : "Before route optimization"}
            </small>
          </div>
        </article>

        <article className="patrol-metric-card">
          <div className="patrol-metric-card__icon patrol-metric-card__icon--purple">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Estimated duration</span>
            <strong>{displayedDuration} min</strong>
            <small>
              {isOptimized
                ? `${timeSaved} minutes saved`
                : "Includes enforcement time"}
            </small>
          </div>
        </article>

        <article className="patrol-metric-card">
          <div className="patrol-metric-card__icon patrol-metric-card__icon--danger">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>Critical stops</span>
            <strong>{criticalStops}</strong>
            <small>
              {selectedRoute.stops.length} total route stops
            </small>
          </div>
        </article>

        <article className="patrol-metric-card">
          <div className="patrol-metric-card__icon patrol-metric-card__icon--warning">
            <ParkingCircle size={20} />
          </div>

          <div>
            <span>Illegal vehicles</span>
            <strong>{totalIllegalVehicles}</strong>
            <small>Across planned enforcement stops</small>
          </div>
        </article>
      </section>

      {isOptimized && (
        <section className="patrol-optimization-banner">
          <Sparkles size={20} />

          <div>
            <strong>Optimized route generated</strong>

            <span>
              High-impact hotspots are prioritized while reducing
              estimated travel distance by{" "}
              {distanceSaved.toFixed(1)} km and total operation time
              by {timeSaved} minutes.
            </span>
          </div>

          <span className="patrol-saving-badge">
            {Math.round(
              (distanceSaved /
                selectedRoute.originalDistanceKm) *
                100,
            )}
            % shorter
          </span>
        </section>
      )}

      <section className="patrol-main-grid">
        <article className="patrol-map-panel">
          <div className="patrol-panel-header">
            <div>
              <h3>Patrol Route Map</h3>
              <p>
                Route starts from the traffic division and follows the
                numbered enforcement stops.
              </p>
            </div>

            <div className="patrol-map-legend">
              <span>
                <i className="patrol-legend-dot patrol-legend-dot--base" />
                Patrol base
              </span>

              <span>
                <i className="patrol-legend-dot patrol-legend-dot--current" />
                Current stop
              </span>

              <span>
                <i className="patrol-legend-dot patrol-legend-dot--completed" />
                Completed
              </span>
            </div>
          </div>

          <div className="patrol-map">
            <MapContainer
              center={[
                selectedRoute.startLatitude,
                selectedRoute.startLongitude,
              ]}
              zoom={13}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <RouteMapController
                coordinates={routeCoordinates}
              />

              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: "#2563eb",
                  weight: 5,
                  opacity: 0.8,
                  dashArray: routeStarted ? undefined : "10 8",
                }}
              />

              <CircleMarker
                center={[
                  selectedRoute.startLatitude,
                  selectedRoute.startLongitude,
                ]}
                radius={13}
                pathOptions={{
                  color: "#ffffff",
                  weight: 3,
                  fillColor: "#101828",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="patrol-popup">
                    <span>Patrol base</span>
                    <strong>
                      {selectedRoute.startLocation}
                    </strong>
                    <p>{selectedRoute.teamName}</p>
                  </div>
                </Popup>
              </CircleMarker>

              {orderedStops.map((stop, index) => {
                const stopStatus = getStopStatus(
                  stop,
                  orderedStops,
                  completedStopIds,
                  routeStarted,
                );

                const markerColor =
                  stopStatus === "Completed"
                    ? "#12b76a"
                    : stopStatus === "Current"
                      ? "#2563eb"
                      : getPriorityColor(stop.priority);

                return (
                  <CircleMarker
                    key={stop.id}
                    center={[
                      stop.latitude,
                      stop.longitude,
                    ]}
                    radius={
                      stopStatus === "Current" ? 17 : 14
                    }
                    pathOptions={{
                      color: "#ffffff",
                      weight: 3,
                      fillColor: markerColor,
                      fillOpacity: 0.95,
                    }}
                  >
                    <Popup minWidth={220}>
                      <div className="patrol-popup">
                        <span>
                          Stop {index + 1} · {stop.priority}
                        </span>

                        <strong>{stop.location}</strong>

                        <p>{stop.zone}</p>

                        <div>
                          <small>Impact score</small>
                          <b>{stop.impactScore}/100</b>
                        </div>

                        <div>
                          <small>Illegal vehicles</small>
                          <b>{stop.illegalVehicles}</b>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </article>

        <aside className="patrol-itinerary-panel">
          <div className="patrol-panel-header">
            <div>
              <h3>Route Itinerary</h3>
              <p>
                {isOptimized
                  ? "Optimized enforcement sequence"
                  : "Original enforcement sequence"}
              </p>
            </div>

            <span>{orderedStops.length} stops</span>
          </div>

          <div className="patrol-base-card">
            <div className="patrol-base-card__icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <span>Starting point</span>
              <strong>{selectedRoute.startLocation}</strong>
              <small>{selectedRoute.shift}</small>
            </div>
          </div>

          <div className="patrol-stop-list">
            {orderedStops.map((stop, index) => {
              const stopStatus = getStopStatus(
                stop,
                orderedStops,
                completedStopIds,
                routeStarted,
              );

              return (
                <article
                  key={stop.id}
                  className={`patrol-stop-card patrol-stop-card--${stopStatus
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  <div className="patrol-stop-card__timeline">
                    <div
                      className="patrol-stop-card__number"
                      style={{
                        background:
                          stopStatus === "Completed"
                            ? "#12b76a"
                            : stopStatus === "Current"
                              ? "#2563eb"
                              : getPriorityColor(
                                  stop.priority,
                                ),
                      }}
                    >
                      {stopStatus === "Completed" ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    {index < orderedStops.length - 1 && (
                      <span />
                    )}
                  </div>

                  <div className="patrol-stop-card__content">
                    <div className="patrol-stop-card__heading">
                      <div>
                        <strong>{stop.location}</strong>
                        <span>
                          {stop.zone} · {stop.cameraId}
                        </span>
                      </div>

                      <b>{stop.impactScore}</b>
                    </div>

                    <div className="patrol-stop-card__metadata">
                      <span>
                        <ParkingCircle size={13} />
                        {stop.illegalVehicles} vehicles
                      </span>

                      <span>
                        <Clock3 size={13} />
                        {stop.estimatedServiceMinutes} min
                      </span>
                    </div>

                    <p>{stop.recommendedAction}</p>

                    <div className="patrol-stop-card__footer">
                      <span
                        className={`patrol-priority patrol-priority--${stop.priority.toLowerCase()}`}
                      >
                        {stop.priority}
                      </span>

                      <span
                        className={`patrol-stop-status patrol-stop-status--${stopStatus.toLowerCase()}`}
                      >
                        {stopStatus}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="patrol-operation-panel">
        <div className="patrol-operation-panel__team">
          <div className="patrol-operation-panel__team-icon">
            <Truck size={22} />
          </div>

          <div>
            <span>Assigned patrol team</span>
            <strong>{selectedRoute.teamName}</strong>
            <small>
              {selectedRoute.vehicleNumber} ·{" "}
              {selectedRoute.shift}
            </small>
          </div>
        </div>

        {!routeStarted && !routeCompleted && (
          <div className="patrol-operation-panel__message">
            <Navigation size={19} />

            <div>
              <strong>Route ready for deployment</strong>
              <span>
                {isOptimized
                  ? "The optimized route is ready to begin."
                  : "Optimize the route before starting for the best result."}
              </span>
            </div>
          </div>
        )}

        {routeStarted && currentStop && (
          <div className="patrol-current-stop">
            <LocateFixed size={19} />

            <div>
              <span>Current destination</span>
              <strong>{currentStop.location}</strong>
              <small>
                Stop{" "}
                {orderedStops.findIndex(
                  (stop) => stop.id === currentStop.id,
                ) + 1}{" "}
                of {orderedStops.length}
              </small>
            </div>
          </div>
        )}

        {routeCompleted && (
          <div className="patrol-complete-message">
            <CheckCircle2 size={20} />

            <div>
              <strong>Patrol route completed</strong>
              <span>
                All assigned enforcement locations have been
                processed.
              </span>
            </div>
          </div>
        )}

        <div className="patrol-operation-actions">
          {!routeStarted && !routeCompleted && (
            <button
              className="patrol-start-button"
              type="button"
              onClick={handleStartRoute}
            >
              <Play size={17} />
              Start patrol route
            </button>
          )}

          {routeStarted && currentStop && (
            <button
              className="patrol-complete-stop-button"
              type="button"
              onClick={handleCompleteCurrentStop}
            >
              <CheckCircle2 size={17} />
              Complete current stop
              <ArrowRight size={16} />
            </button>
          )}

          {(routeStarted || routeCompleted) && (
            <button
              className="patrol-reset-button"
              type="button"
              onClick={handleResetRoute}
            >
              <RefreshCcw size={16} />
              Reset demonstration
            </button>
          )}
        </div>
      </section>

      <section className="patrol-insights-grid">
        <article className="patrol-insight-card">
          <Gauge size={21} />

          <div>
            <span>Optimization objective</span>
            <strong>
              Reduce travel time while prioritizing severe hotspots
            </strong>
            <p>
              Critical incidents are scheduled earlier, followed by
              nearby high- and medium-priority locations.
            </p>
          </div>
        </article>

        <article className="patrol-insight-card">
          <Navigation size={21} />

          <div>
            <span>Route result</span>
            <strong>
              {distanceSaved.toFixed(1)} km and {timeSaved} minutes
              potentially saved
            </strong>
            <p>
              The recommendation is a prototype simulation based on
              hotspot severity and prepared travel estimates.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}

export default PatrolRoutes;