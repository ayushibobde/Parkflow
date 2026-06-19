import "leaflet/dist/leaflet.css";

import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  Filter,
  Gauge,
  LocateFixed,
  MapPin,
  ParkingCircle,
  Search,
  ShieldCheck,
  Siren,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { parkFlowApi } from "../services/api";
import type { Hotspot } from "../types/hotspot";
import type { Priority } from "../types/incident";

type PriorityFilter = "All" | Priority;

interface MapFlyToProps {
  latitude: number;
  longitude: number;
}

function MapFlyTo({ latitude, longitude }: MapFlyToProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], 15, {
      duration: 1,
    });
  }, [latitude, longitude, map]);

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

function getPriorityRadius(priority: Priority) {
  switch (priority) {
    case "Critical":
      return 18;
    case "High":
      return 15;
    case "Medium":
      return 12;
    case "Low":
      return 10;
    default:
      return 10;
  }
}

interface HotspotMetricProps {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof Camera;
}

function HotspotMetric({
  label,
  value,
  helper,
  icon: Icon,
}: HotspotMetricProps) {
  return (
    <article className="hotspot-metric-card">
      <div className="hotspot-metric-card__icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [priorityFilter, setPriorityFilter] =
    useState<PriorityFilter>("All");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotspotId, setSelectedHotspotId] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const loadHotspots = useCallback(async () => {
    try {
      setError("");

      const response = await parkFlowApi.getHotspotsOld();
      const data = (response as { data?: Hotspot[] }).data ?? [];

      setHotspots(data);
      setSelectedHotspotId((currentId) =>
        currentId && data.some((hotspot) => hotspot.id === currentId)
          ? currentId
          : data[0]?.id ?? "",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load hotspots.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHotspots();
  }, [loadHotspots]);

  const filteredHotspots = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return hotspots.filter((hotspot) => {
      const matchesPriority =
        priorityFilter === "All" ||
        hotspot.priority === priorityFilter;

      const matchesSearch =
        !normalizedQuery ||
        hotspot.name.toLowerCase().includes(normalizedQuery) ||
        hotspot.zone.toLowerCase().includes(normalizedQuery) ||
        hotspot.cameraId.toLowerCase().includes(normalizedQuery);

      return matchesPriority && matchesSearch;
    });
  }, [hotspots, priorityFilter, searchQuery]);

  const selectedHotspot = hotspots.find(
    (hotspot) => hotspot.id === selectedHotspotId,
  );

  const totalIllegalVehicles = hotspots.reduce(
    (total, hotspot) => total + hotspot.illegalVehicles,
    0,
  );

  const criticalCount = hotspots.filter(
    (hotspot) => hotspot.priority === "Critical",
  ).length;

  const averageImpactScore = hotspots.length
    ? Math.round(
        hotspots.reduce(
          (total, hotspot) => total + hotspot.impactScore,
          0,
        ) / hotspots.length,
      )
    : 0;

  const averageSpeedLoss = hotspots.length
    ? Math.round(
        hotspots.reduce((total, hotspot) => {
          const speedLoss =
            ((hotspot.baselineSpeed - hotspot.currentSpeed) /
              hotspot.baselineSpeed) *
            100;

          return total + speedLoss;
        }, 0) / hotspots.length,
      )
    : 0;

  const sortedHotspots = [...filteredHotspots].sort(
    (first, second) =>
      second.impactScore - first.impactScore,
  );

  function clearFilters() {
    setPriorityFilter("All");
    setSearchQuery("");
  }

  if (loading) {
    return (
      <main className="hotspots-page">
        <h2>Loading hotspot intelligence...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="hotspots-page">
        <h2>{error}</h2>
      </main>
    );
  }

  if (!selectedHotspot) {
    return (
      <main className="hotspots-page">
        <h2>No hotspots available from dataset.</h2>
      </main>
    );
  }

  return (
    <main className="hotspots-page">
      <header className="hotspots-header">
        <div>
          <p className="hotspots-header__eyebrow">
            Geospatial Congestion Intelligence
          </p>

          <h2>Parking Hotspot Intelligence</h2>

          <p>
            Identify recurring illegal-parking zones, compare their
            congestion impact and prioritize enforcement resources.
          </p>
        </div>

        <div className="hotspots-header__live">
          <span />
          {hotspots.length} monitored zones
        </div>
      </header>

      <section className="hotspot-metrics-grid">
        <HotspotMetric
          label="Monitored hotspots"
          value={hotspots.length}
          helper="Across connected CCTV zones"
          icon={MapPin}
        />

        <HotspotMetric
          label="Critical hotspots"
          value={criticalCount}
          helper="Immediate action required"
          icon={AlertTriangle}
        />

        <HotspotMetric
          label="Illegal vehicles"
          value={totalIllegalVehicles}
          helper="Detected across all zones"
          icon={CarFront}
        />

        <HotspotMetric
          label="Average impact"
          value={averageImpactScore}
          helper={`${averageSpeedLoss}% average speed loss`}
          icon={Gauge}
        />
      </section>

      <section className="hotspot-toolbar">
        <div className="hotspot-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search location, zone or camera..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
          />

          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          className={`hotspot-filter-toggle ${
            showFilters
              ? "hotspot-filter-toggle--active"
              : ""
          }`}
          type="button"
          onClick={() =>
            setShowFilters((currentValue) => !currentValue)
          }
        >
          <Filter size={16} />
          Filter hotspots
        </button>

        {(priorityFilter !== "All" || searchQuery) && (
          <button
            className="hotspot-clear-button"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </section>

      {showFilters && (
        <section className="hotspot-filter-panel">
          <div>
            <span>Priority</span>

            <div className="hotspot-filter-options">
              {(
                [
                  "All",
                  "Critical",
                  "High",
                  "Medium",
                  "Low",
                ] as PriorityFilter[]
              ).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={
                    priorityFilter === priority
                      ? "hotspot-filter-option hotspot-filter-option--active"
                      : "hotspot-filter-option"
                  }
                  onClick={() =>
                    setPriorityFilter(priority)
                  }
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="hotspot-main-grid">
        <article className="hotspot-map-panel">
          <div className="hotspot-panel-header">
            <div>
              <h3>Live Hotspot Map</h3>
              <p>
                Marker size and colour indicate congestion severity.
              </p>
            </div>

            <div className="hotspot-map-legend">
              <span>
                <i className="legend-dot legend-dot--critical" />
                Critical
              </span>

              <span>
                <i className="legend-dot legend-dot--high" />
                High
              </span>

              <span>
                <i className="legend-dot legend-dot--medium" />
                Medium
              </span>

              <span>
                <i className="legend-dot legend-dot--low" />
                Low
              </span>
            </div>
          </div>

          <div className="hotspot-map">
            <MapContainer
              center={[
                selectedHotspot.latitude,
                selectedHotspot.longitude,
              ]}
              zoom={13}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyTo
                latitude={selectedHotspot.latitude}
                longitude={selectedHotspot.longitude}
              />

              {filteredHotspots.map((hotspot) => {
                const markerColor = getPriorityColor(
                  hotspot.priority,
                );

                return (
                  <CircleMarker
                    key={hotspot.id}
                    center={[
                      hotspot.latitude,
                      hotspot.longitude,
                    ]}
                    radius={getPriorityRadius(
                      hotspot.priority,
                    )}
                    pathOptions={{
                      color: "#ffffff",
                      weight: 3,
                      fillColor: markerColor,
                      fillOpacity: 0.88,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedHotspotId(hotspot.id),
                    }}
                  >
                    <Popup minWidth={230}>
                      <div className="hotspot-map-popup">
                        <span
                          style={{
                            color: markerColor,
                          }}
                        >
                          {hotspot.priority} priority
                        </span>

                        <strong>{hotspot.name}</strong>

                        <p>{hotspot.zone}</p>

                        <div>
                          <small>Impact score</small>
                          <b>{hotspot.impactScore}/100</b>
                        </div>

                        <div>
                          <small>Illegal vehicles</small>
                          <b>{hotspot.illegalVehicles}</b>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedHotspotId(hotspot.id)
                          }
                        >
                          View location details
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </article>

        <aside className="hotspot-ranking-panel">
          <div className="hotspot-panel-header">
            <div>
              <h3>Enforcement Ranking</h3>
              <p>
                Ordered by congestion impact score.
              </p>
            </div>

            <span className="hotspot-result-count">
              {sortedHotspots.length} results
            </span>
          </div>

          <div className="hotspot-ranking-list">
            {sortedHotspots.length > 0 ? (
              sortedHotspots.map((hotspot, index) => (
                <button
                  type="button"
                  key={hotspot.id}
                  className={
                    selectedHotspot.id === hotspot.id
                      ? "hotspot-ranking-item hotspot-ranking-item--selected"
                      : "hotspot-ranking-item"
                  }
                  onClick={() =>
                    setSelectedHotspotId(hotspot.id)
                  }
                >
                  <div
                    className="hotspot-ranking-item__rank"
                    style={{
                      background: getPriorityColor(
                        hotspot.priority,
                      ),
                    }}
                  >
                    {index + 1}
                  </div>

                  <div className="hotspot-ranking-item__content">
                    <div className="hotspot-ranking-item__title">
                      <strong>{hotspot.name}</strong>
                      <span>{hotspot.impactScore}</span>
                    </div>

                    <p>
                      {hotspot.zone} ·{" "}
                      {hotspot.illegalVehicles} illegal vehicles
                    </p>

                    <div className="hotspot-ranking-item__bar">
                      <span
                        style={{
                          width: `${hotspot.impactScore}%`,
                          background: getPriorityColor(
                            hotspot.priority,
                          ),
                        }}
                      />
                    </div>
                  </div>

                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <div className="hotspot-empty-result">
                <LocateFixed size={30} />
                <strong>No hotspots found</strong>
                <p>Try changing the search or priority filter.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="hotspot-detail-panel">
        <div className="hotspot-detail-panel__header">
          <div>
            <div className="hotspot-detail-panel__location">
              <MapPin size={18} />

              <span>
                {selectedHotspot.zone} ·{" "}
                {selectedHotspot.cameraId}
              </span>
            </div>

            <h3>{selectedHotspot.name}</h3>

            <p>
              Last parking violation detected{" "}
              {selectedHotspot.lastDetected}.
            </p>
          </div>

          <div className="hotspot-detail-panel__badges">
            <span
              className={`hotspot-priority-badge hotspot-priority-badge--${selectedHotspot.priority.toLowerCase()}`}
            >
              {selectedHotspot.priority}
            </span>

            <span className="hotspot-status-badge">
              {selectedHotspot.status}
            </span>
          </div>
        </div>

        <div className="hotspot-detail-content">
          <div className="hotspot-impact-section">
            <div
    className="hotspot-impact-score"
    style={
        {
        "--hotspot-score": selectedHotspot.impactScore,
        } as React.CSSProperties
    }
    >
              <div>
                <strong>
                  {selectedHotspot.impactScore}
                </strong>
                <span>Impact Score</span>
              </div>
            </div>

            <div className="hotspot-impact-statistics">
              <div>
                <span>Illegal vehicles</span>
                <strong>
                  {selectedHotspot.illegalVehicles}
                </strong>
              </div>

              <div>
                <span>Lane blockage</span>
                <strong>
                  {selectedHotspot.laneBlockagePercent}%
                </strong>
              </div>

              <div>
                <span>Traffic density</span>
                <strong>
                  {selectedHotspot.trafficDensityPercent}%
                </strong>
              </div>

              <div>
                <span>Current speed</span>
                <strong>
                  {selectedHotspot.currentSpeed} km/h
                </strong>
              </div>
            </div>
          </div>

          <div className="hotspot-pattern-section">
            <h4>Recurring congestion pattern</h4>

            <div className="hotspot-pattern-row">
              <Clock3 size={17} />

              <div>
                <span>Peak violation time</span>
                <strong>
                  {selectedHotspot.peakTime}
                </strong>
              </div>
            </div>

            <div className="hotspot-pattern-row">
              <ParkingCircle size={17} />

              <div>
                <span>Observed pattern</span>
                <strong>
                  {selectedHotspot.recurringPattern}
                </strong>
              </div>
            </div>

            <div className="hotspot-pattern-row">
              <Gauge size={17} />

              <div>
                <span>Normal versus current speed</span>
                <strong>
                  {selectedHotspot.baselineSpeed} km/h →{" "}
                  {selectedHotspot.currentSpeed} km/h
                </strong>
              </div>
            </div>
          </div>

          <div className="hotspot-action-section">
            <div className="hotspot-action-section__title">
              <Siren size={19} />

              <div>
                <span>Recommended enforcement action</span>
                <strong>
                  {selectedHotspot.recommendedAction}
                </strong>
              </div>
            </div>

            <div className="hotspot-resource-list">
              <div>
                <Users size={17} />
                <span>Officers</span>
                <strong>
                  {selectedHotspot.officersRequired}
                </strong>
              </div>

              <div>
                <Truck size={17} />
                <span>Towing units</span>
                <strong>
                  {selectedHotspot.towVehiclesRequired}
                </strong>
              </div>

              <div>
                <Clock3 size={17} />
                <span>Clearance</span>
                <strong>
                  {selectedHotspot.estimatedClearanceMinutes} min
                </strong>
              </div>
            </div>

            <button type="button">
              <ShieldCheck size={17} />
              Open enforcement plan
            </button>
          </div>
        </div>

        {selectedHotspot.status === "Cleared" && (
          <div className="hotspot-cleared-notice">
            <CheckCircle2 size={17} />
            This hotspot has been cleared and remains under
            monitoring.
          </div>
        )}
      </section>
    </main>
  );
}

export default Hotspots;