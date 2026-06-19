import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  Truck,
  Users,
} from "lucide-react";
import PriorityBadge from "../components/PriorityBadge";
import { parkFlowApi } from "../services/api";
import type {
  EnforcementCase,
  EnforcementStatus,
} from "../types/enforcement";
import './Enforcement.css';

const statusOptions: Array<"All" | EnforcementStatus> = [
  "All",
  "Pending",
  "Dispatched",
  "On Site",
  "Cleared",
];

function getNextStatus(
  status: EnforcementStatus,
): EnforcementStatus | null {
  const transitions: Record<
    EnforcementStatus,
    EnforcementStatus | null
  > = {
    Pending: "Dispatched",
    Dispatched: "On Site",
    "On Site": "Cleared",
    Cleared: null,
  };

  return transitions[status];
}

function getActionLabel(status: EnforcementStatus): string {
  const labels: Record<EnforcementStatus, string> = {
    Pending: "Dispatch enforcement team",
    Dispatched: "Mark team as on site",
    "On Site": "Mark location as cleared",
    Cleared: "Clearance completed",
  };

  return labels[status];
}

function Enforcement() {
  const [cases, setCases] = useState<EnforcementCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | EnforcementStatus
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadCases = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await parkFlowApi.getEnforcementCases();
      setCases((response as { data: EnforcementCase[] })?.data || []);
      setSelectedCaseId((response as { data: EnforcementCase[] })?.data?.[0]?.id ?? "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load enforcement cases.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const filteredCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesSearch =
        !query ||
        item.location.toLowerCase().includes(query) ||
        item.zone.toLowerCase().includes(query) ||
        item.cameraId.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.assignedUnit.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [cases, searchQuery, statusFilter]);

  const selectedCase = useMemo(
    () =>
      cases.find((item) => item.id === selectedCaseId) ??
      cases[0] ??
      null,
    [cases, selectedCaseId],
  );

  const summary = useMemo(
    () => ({
      pending: cases.filter((item) => item.status === "Pending")
        .length,
      dispatched: cases.filter(
        (item) => item.status === "Dispatched",
      ).length,
      onSite: cases.filter((item) => item.status === "On Site")
        .length,
      cleared: cases.filter((item) => item.status === "Cleared")
        .length,
    }),
    [cases],
  );

  async function updateCaseStatus(
    id: string,
    status: EnforcementStatus,
  ) {
    try {
      setError("");
      setUpdatingId(id);

      const updatedCase =
        await parkFlowApi.updateEnforcementStatus(id, status);

      setCases((currentCases) =>        
        (currentCases as EnforcementCase[]).map((item) =>
          item.id === (updatedCase as EnforcementCase).id ? updatedCase as EnforcementCase : item,
        ),
      );
      setSelectedCaseId((updatedCase as EnforcementCase).id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update enforcement status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function handlePrimaryAction() {
    if (!selectedCase) return;

    const nextStatus = getNextStatus(selectedCase.status);
    if (!nextStatus) return;

    await updateCaseStatus(selectedCase.id, nextStatus);
  }

  if (loading) {
    return (
      <main className="enforcement-page">
        <section className="page-state">
          <Loader2 className="spin" size={30} />
          <h2>Loading enforcement planner</h2>
          <p>Fetching enforcement cases from the backend.</p>
        </section>
      </main>
    );
  }

  if (error && cases.length === 0) {
    return (
      <main className="enforcement-page">
        <section className="page-state page-state--error">
          <AlertTriangle size={30} />
          <h2>Unable to load enforcement cases</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadCases()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="enforcement-page">
      <header className="enforcement-header">
        <div>
          <p className="enforcement-header__eyebrow">
            Enforcement operations
          </p>
          <h1>Enforcement Planner</h1>
          <p>
            Dispatch teams and persist every status update through the
            ParkFlow backend.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCases(true)}
          disabled={refreshing}
          className="enforcement-refresh-button"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "spin" : undefined}
          />
          {refreshing ? "Refreshing..." : "Refresh cases"}
        </button>
      </header>

      {error && (
        <div className="enforcement-inline-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="enforcement-summary-grid">
        <article>
          <Clock3 size={19} />
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </article>
        <article>
          <Siren size={19} />
          <span>Dispatched</span>
          <strong>{summary.dispatched}</strong>
        </article>
        <article>
          <Users size={19} />
          <span>On site</span>
          <strong>{summary.onSite}</strong>
        </article>
        <article>
          <CheckCircle2 size={19} />
          <span>Cleared</span>
          <strong>{summary.cleared}</strong>
        </article>
      </section>

      <section className="enforcement-toolbar">
        <label className="enforcement-search">
          <Search size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search case, location, zone or team"
          />
        </label>

        <div className="enforcement-status-filters">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? "is-active" : undefined}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <section className="enforcement-layout">
        <aside className="enforcement-case-list">
          <div className="enforcement-case-list__header">
            <h2>Enforcement queue</h2>
            <p>{filteredCases.length} matching cases</p>
          </div>

          {filteredCases.length === 0 ? (
            <div className="enforcement-empty-state">
              No cases match the selected filters.
            </div>
          ) : (
            filteredCases.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`enforcement-case-card ${
                  selectedCase?.id === item.id
                    ? "enforcement-case-card--selected"
                    : ""
                }`}
                onClick={() => setSelectedCaseId(item.id)}
              >
                <div className="enforcement-case-card__top">
                  <div>
                    <strong>{item.location}</strong>
                    <span>{item.id}</span>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>

                <div className="enforcement-case-card__meta">
                  <span>
                    <MapPin size={13} />
                    {item.zone}
                  </span>
                  <span>Impact {item.impactScore}/100</span>
                </div>

                <div className="enforcement-case-card__bottom">
                  <span
                    className={`enforcement-status enforcement-status--${item.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {item.status}
                  </span>
                  <small>{item.assignedUnit}</small>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="enforcement-detail">
          {!selectedCase ? (
            <div className="enforcement-empty-state">
              Select an enforcement case.
            </div>
          ) : (
            <>
              <header className="enforcement-detail__header">
                <div>
                  <span>{selectedCase.id}</span>
                  <h2>{selectedCase.location}</h2>
                  <p>
                    {selectedCase.zone} · {selectedCase.cameraId}
                  </p>
                </div>

                <div className="enforcement-detail__badges">
                  <PriorityBadge priority={selectedCase.priority} />
                  <span
                    className={`enforcement-status enforcement-status--${selectedCase.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {selectedCase.status}
                  </span>
                </div>
              </header>

              <section className="enforcement-detail__metrics">
                <article>
                  <span>Impact score</span>
                  <strong>{selectedCase.impactScore}/100</strong>
                </article>
                <article>
                  <span>Illegal vehicles</span>
                  <strong>{selectedCase.illegalVehicles}</strong>
                </article>
                <article>
                  <span>Lane blockage</span>
                  <strong>{selectedCase.laneBlockagePercent}%</strong>
                </article>
                <article>
                  <span>Clearance time</span>
                  <strong>
                    {selectedCase.estimatedClearanceMinutes} min
                  </strong>
                </article>
              </section>

              <section className="enforcement-speed-card">
                <div>
                  <span>Current speed</span>
                  <strong>{selectedCase.currentSpeed} km/h</strong>
                </div>
                <span>→</span>
                <div>
                  <span>Predicted after clearance</span>
                  <strong>
                    {selectedCase.predictedClearedSpeed} km/h
                  </strong>
                </div>
              </section>

              <section className="enforcement-information-grid">
                <article>
                  <ShieldCheck size={18} />
                  <div>
                    <span>Recommended action</span>
                    <strong>{selectedCase.recommendedAction}</strong>
                    <p>{selectedCase.reason}</p>
                  </div>
                </article>

                <article>
                  <Users size={18} />
                  <div>
                    <span>Assigned resources</span>
                    <strong>{selectedCase.assignedUnit}</strong>
                    <p>
                      {selectedCase.officersRequired} officers ·{" "}
                      {selectedCase.towVehiclesRequired} tow vehicles
                    </p>
                  </div>
                </article>

                <article>
                  <Truck size={18} />
                  <div>
                    <span>Detection information</span>
                    <strong>Detected {selectedCase.detectedAt}</strong>
                    <p>Status updates are saved by the backend.</p>
                  </div>
                </article>
              </section>

              <section className="enforcement-timeline">
                {(
                  [
                    "Pending",
                    "Dispatched",
                    "On Site",
                    "Cleared",
                  ] as EnforcementStatus[]
                ).map((status, index, statuses) => {
                  const currentIndex = statuses.indexOf(
                    selectedCase.status,
                  );
                  const isComplete = index <= currentIndex;

                  return (
                    <div
                      key={status}
                      className={
                        isComplete
                          ? "enforcement-timeline__step enforcement-timeline__step--complete"
                          : "enforcement-timeline__step"
                      }
                    >
                      <span>
                        {isComplete ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <strong>{status}</strong>
                    </div>
                  );
                })}
              </section>

              <footer className="enforcement-detail__footer">
                {selectedCase.status === "Cleared" ? (
                  <div className="enforcement-success-message">
                    <CheckCircle2 size={18} />
                    Clearance completed successfully. Refresh the page
                    to confirm the status remains saved.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handlePrimaryAction()}
                    disabled={updatingId === selectedCase.id}
                    className="enforcement-primary-action"
                  >
                    {updatingId === selectedCase.id ? (
                      <Loader2 className="spin" size={17} />
                    ) : (
                      <Siren size={17} />
                    )}
                    {updatingId === selectedCase.id
                      ? "Saving update..."
                      : getActionLabel(selectedCase.status)}
                  </button>
                )}
              </footer>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default Enforcement;
