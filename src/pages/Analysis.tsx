import {
    Activity,
    AlertTriangle,
    Camera,
    CarFront,
    CheckCircle2,
    Clock3,
    Eye,
    Gauge,
    LoaderCircle,
    MapPin,
    Play,
    RefreshCcw,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Truck,
    Users,
  } from "lucide-react";
  import {
    type ChangeEvent,
    type CSSProperties,
    useEffect,
    useMemo,
    useState,
  } from "react";
  import { parkFlowApi } from "../services/api";
  import type { TrafficScenario } from "../types/trafficScenario";
  import './Analysis.css';
  
  interface AnalysisMetricProps {
    label: string;
    value: string | number;
    helper: string;
    icon: typeof Camera;
  }
  
  function AnalysisMetric({
    label,
    value,
    helper,
    icon: Icon,
  }: AnalysisMetricProps) {
    return (
      <article className="analysis-metric">
        <div className="analysis-metric__icon">
          <Icon size={19} />
        </div>
  
        <div>
          <p>{label}</p>
          <strong>{value}</strong>
          <span>{helper}</span>
        </div>
      </article>
    );
  }
  
  function getPriorityColor(priority: TrafficScenario["priority"]) {
    switch (priority) {
      case "Critical":
        return "#f04438";
      case "High":
        return "#f79009";
      case "Medium":
        return "#7f56d9";
      default:
        return "#12b76a";
    }
  }
  
  function Analysis() {
    const [scenarios, setScenarios] = useState<TrafficScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScenarioId, setSelectedScenarioId] = useState("");
  
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [showDetections, setShowDetections] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);
    const [actionStarted, setActionStarted] = useState(false);

    useEffect(() => {
      const loadScenarios = async () => {
        try {
          setLoading(true);

          const response = await parkFlowApi.getScenarios();
          const data =
            (response as { data?: TrafficScenario[] }).data ?? [];

          setScenarios(data);
          setSelectedScenarioId(data[0]?.id ?? "");
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      void loadScenarios();
    }, []);
  
    const selectedScenario = useMemo(
      () =>
        scenarios.find(
          (scenario) => scenario.id === selectedScenarioId,
        ) ?? scenarios[0],
      [scenarios, selectedScenarioId],
    );

    if (loading) {
      return (
        <main className="analysis-page">
          <h2>Loading CCTV scenarios...</h2>
        </main>
      );
    }

    if (!selectedScenario) {
      return (
        <main className="analysis-page">
          <h2>No CCTV scenarios available from dataset.</h2>
        </main>
      );
    }
  
    const speedReduction = Math.round(
      ((selectedScenario.baselineSpeed - selectedScenario.currentSpeed) /
        selectedScenario.baselineSpeed) *
        100,
    );
  
    const durationScore = Math.min(
      100,
      Math.round((selectedScenario.parkingDurationMinutes / 60) * 100),
    );
  
    const intersectionScore =
      selectedScenario.distanceFromIntersectionMeters <= 25
        ? 100
        : selectedScenario.distanceFromIntersectionMeters <= 50
          ? 75
          : selectedScenario.distanceFromIntersectionMeters <= 100
            ? 40
            : 10;
  
    const scoreFactors = [
      {
        label: "Lane blockage",
        value: selectedScenario.laneBlockagePercent,
        weight: "35%",
      },
      {
        label: "Traffic density",
        value: selectedScenario.trafficDensityPercent,
        weight: "25%",
      },
      {
        label: "Speed reduction",
        value: speedReduction,
        weight: "20%",
      },
      {
        label: "Parking duration",
        value: durationScore,
        weight: "10%",
      },
      {
        label: "Intersection proximity",
        value: intersectionScore,
        weight: "10%",
      },
    ];
  
    const priorityColor = getPriorityColor(selectedScenario.priority);
  
    const scoreStyle = {
      "--impact-score": `${selectedScenario.impactScore * 3.6}deg`,
      "--impact-color": priorityColor,
    } as CSSProperties;
  
    function handleScenarioChange(event: ChangeEvent<HTMLSelectElement>) {
      setSelectedScenarioId(event.target.value);
      setHasAnalyzed(false);
      setIsAnalyzing(false);
      setShowDetections(true);
      setImageFailed(false);
      setActionStarted(false);
    }
  
    function handleAnalyze() {
      setIsAnalyzing(true);
      setHasAnalyzed(false);
      setActionStarted(false);
  
      window.setTimeout(() => {
        setIsAnalyzing(false);
        setHasAnalyzed(true);
      }, 900);
    }
  
    return (
      <main className="analysis-page">
        <header className="analysis-page__header">
          <div>
            <p className="analysis-page__eyebrow">
              AI Traffic Image Processing
            </p>
  
            <h2>CCTV Parking Analysis</h2>
  
            <p>
              Analyse prepared traffic scenarios, identify illegal parking and
              quantify its effect on traffic flow.
            </p>
          </div>
  
          <div className="analysis-page__status">
            <span className="analysis-page__status-dot" />
            Detection service operational
          </div>
        </header>
  
        <section className="analysis-control-panel">
          <div className="analysis-control-panel__field">
            <label htmlFor="traffic-scenario">Select CCTV scenario</label>
  
            <select
              id="traffic-scenario"
              value={selectedScenarioId}
              onChange={handleScenarioChange}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>
  
          <div className="analysis-control-panel__camera">
            <Camera size={18} />
  
            <div>
              <span>{selectedScenario.cameraId}</span>
              <small>{selectedScenario.timestamp}</small>
            </div>
          </div>
  
          <button
            className="analysis-run-button"
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <LoaderCircle className="analysis-spinner" size={18} />
                Analysing image
              </>
            ) : (
              <>
                <Play size={18} />
                Run AI analysis
              </>
            )}
          </button>
        </section>
  
        <section className="analysis-workspace">
          <article className="camera-panel">
            <div className="camera-panel__header">
              <div>
                <div className="camera-panel__title">
                  <span className="camera-live-dot" />
                  Live camera snapshot
                </div>
  
                <p>{selectedScenario.location}</p>
              </div>
  
              <button
                className="overlay-toggle"
                type="button"
                onClick={() => setShowDetections((current) => !current)}
                disabled={!hasAnalyzed}
              >
                <Eye size={16} />
                {showDetections ? "Hide detections" : "Show detections"}
              </button>
            </div>
  
            <div className="camera-frame">
            <div className="cctv-ai-active">
  🤖 AI VISION ACTIVE
</div>
              {!imageFailed ? (
                <img
                  src={selectedScenario.image}
                  alt={`Traffic CCTV view from ${selectedScenario.location}`}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="camera-image-fallback">
                  <Camera size={42} />
  
                  <strong>Traffic image not found</strong>
  
                  <p>
                    Add the image at
                    <code>{selectedScenario.image}</code>
                  </p>
                </div>
              )}
  
              <div className="camera-frame__top-bar">
                <span>
                  <span className="camera-live-dot" />
                  LIVE
                </span>
  
                <span>{selectedScenario.cameraId}</span>
  
                <span>{selectedScenario.timestamp}</span>
              </div>
  
              {isAnalyzing && (
                <div className="camera-scanning-overlay">
                  <div className="camera-scan-line" />
  
                  <ScanLine size={38} />
  
                  <strong>Scanning vehicles and road lanes</strong>
  
                  <span>Running simulated computer-vision inference</span>
                </div>
              )}
  
              {hasAnalyzed &&
                showDetections &&
                selectedScenario.detections.map((detection) => (
                  <div
                    key={detection.id}
                    className={`detection-box detection-box--${detection.severity}`}
                    style={{
                      left: `${detection.x}%`,
                      top: `${detection.y}%`,
                      width: `${detection.width}%`,
                      height: `${detection.height}%`,
                    }}
                  >
                    <span>
                      {detection.label}{" "}
                      {Math.round(detection.confidence * 100)}%
                    </span>
                  </div>
                ))}
  
              {!hasAnalyzed && !isAnalyzing && (
                <div className="camera-ready-message">
                  <ScanLine size={26} />
  
                  <div>
                    <strong>Ready for analysis</strong>
                    <span>Click “Run AI analysis” to process this image.</span>
                  </div>
                </div>
              )}
            </div>
  
            <div className="camera-panel__description">
              <MapPin size={17} />
  
              <p>{selectedScenario.description}</p>
            </div>
            <div className="ai-findings">
  <h3>AI Findings</h3>

  <div>
    🚗 Vehicles Detected:
    <strong>{selectedScenario.vehiclesDetected}</strong>
  </div>

  <div>
    🚫 Illegal Vehicles:
    <strong>{selectedScenario.illegalVehicles}</strong>
  </div>

  <div>
    🛣 Lane Blockage:
    <strong>{selectedScenario.laneBlockagePercent}%</strong>
  </div>

  <div>
    ⚠ Traffic Density:
    <strong>{selectedScenario.trafficDensityPercent}%</strong>
  </div>
</div>
          </article>
  
          <aside className="analysis-results-panel">
            <div className="analysis-results-panel__header">
              <div>
                <p>Analysis result</p>
                <h3>Congestion Impact</h3>
              </div>
  
              {hasAnalyzed && (
                <span
                  className={`analysis-priority analysis-priority--${selectedScenario.priority.toLowerCase()}`}
                >
                  {selectedScenario.priority}
                </span>
              )}
            </div>
            {hasAnalyzed && (
  <div
    className={`severity-banner severity-banner--${selectedScenario.priority.toLowerCase()}`}
  >
    {selectedScenario.priority} Congestion Zone
  </div>
)}
  
            {!hasAnalyzed ? (
              <div className="analysis-empty-state">
                {isAnalyzing ? (
                  <>
                    <LoaderCircle
                      className="analysis-spinner"
                      size={38}
                    />
  
                    <h4>Processing CCTV image</h4>
  
                    <p>
                      Detecting parked vehicles, traffic density and lane
                      blockage.
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles size={38} />
  
                    <h4>No analysis generated</h4>
  
                    <p>
                      Select a prepared CCTV scenario and run the simulated AI
                      analysis.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div
                  className="impact-score-circle"
                  style={scoreStyle}
                  aria-label={`Impact score ${selectedScenario.impactScore} out of 100`}
                >
                  <div className="impact-score-circle__inner">
                    <strong>{selectedScenario.impactScore}</strong>
                    <span>out of 100</span>
                  </div>
                </div>
  
                <div className="analysis-confidence">
                  <CheckCircle2 size={16} />
  
                  <span>
                    AI confidence{" "}
                    <strong>
                      {Math.round(selectedScenario.confidence * 100)}%
                    </strong>
                  </span>
                </div>
  
                <div className="analysis-result-summary">
                  <div>
                    <span>Priority level</span>
                    <strong>{selectedScenario.priority}</strong>
                  </div>
  
                  <div>
                    <span>Incident status</span>
                    <strong>{selectedScenario.status}</strong>
                  </div>
                </div>
  
                <div className="analysis-alert">
                  <AlertTriangle size={18} />
  
                  <div>
                    <strong>Enforcement intervention recommended</strong>
  
                    <p>
                      Parking activity is producing a measurable reduction in
                      road capacity and vehicle speed.
                    </p>
                  </div>
                </div>
                <div className="ai-narrative">
  <h4>AI Explanation</h4>

  <p>
    {selectedScenario.illegalVehicles} illegally parked vehicles
    are blocking approximately{" "}
    {selectedScenario.laneBlockagePercent}% of available road width.

    Traffic speed reduced from{" "}
    {selectedScenario.baselineSpeed} km/h to{" "}
    {selectedScenario.currentSpeed} km/h.

    Overall congestion impact score:
    {selectedScenario.impactScore}/100.
  </p>
</div>
              </>
            )}
          </aside>
        </section>
  
        {hasAnalyzed && (
          <>
            <section className="analysis-metrics-grid">
              <AnalysisMetric
                label="Vehicles detected"
                value={selectedScenario.vehiclesDetected}
                helper="All visible vehicles"
                icon={CarFront}
              />
  
              <AnalysisMetric
                label="Illegal vehicles"
                value={selectedScenario.illegalVehicles}
                helper="Require verification"
                icon={AlertTriangle}
              />
  
              <AnalysisMetric
                label="Lane blockage"
                value={`${selectedScenario.laneBlockagePercent}%`}
                helper="Usable carriageway lost"
                icon={Activity}
              />
  
              <AnalysisMetric
                label="Current speed"
                value={`${selectedScenario.currentSpeed} km/h`}
                helper={`Normal speed ${selectedScenario.baselineSpeed} km/h`}
                icon={Gauge}
              />
  
              <AnalysisMetric
                label="Parking duration"
                value={`${selectedScenario.parkingDurationMinutes} min`}
                helper="Estimated stationary time"
                icon={Clock3}
              />
            </section>
  
            <section className="analysis-details-grid">
              <article className="score-breakdown-panel">
                <div className="analysis-section-header">
                  <div>
                    <h3>Impact Score Breakdown</h3>
                    <p>
                      Explainable factors used to prioritize this location.
                    </p>
                  </div>
  
                  <div className="score-breakdown-panel__score">
                    {selectedScenario.impactScore}/100
                  </div>
                </div>
  
                <div className="score-factor-list">
                  {scoreFactors.map((factor) => (
                    <div className="score-factor" key={factor.label}>
                      <div className="score-factor__header">
                        <span>{factor.label}</span>
  
                        <div>
                          <strong>{factor.value}</strong>
                          <small>Weight {factor.weight}</small>
                        </div>
                      </div>
  
                      <div className="score-factor__bar">
                        <span style={{ width: `${factor.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
  
              <article className="recommendation-panel">
                <div className="analysis-section-header">
                  <div>
                    <h3>Recommended Enforcement Plan</h3>
                    <p>Action generated from congestion-impact indicators.</p>
                  </div>
  
                  <ShieldCheck size={24} />
                </div>
  
                <div className="recommendation-primary">
                  <span>Recommended action</span>
                  <strong>
                    {selectedScenario.recommendation.action}
                  </strong>
                </div>
  
                <div className="recommendation-resources">
                  <div>
                    <Users size={19} />
  
                    <span>Officers</span>
  
                    <strong>
                      {selectedScenario.recommendation.officersRequired}
                    </strong>
                  </div>
  
                  <div>
                    <Truck size={19} />
  
                    <span>Towing units</span>
  
                    <strong>
                      {selectedScenario.recommendation.towVehiclesRequired}
                    </strong>
                  </div>
  
                  <div>
                    <Clock3 size={19} />
  
                    <span>Monitoring</span>
  
                    <strong>
                      {
                        selectedScenario.recommendation
                          .monitoringDurationMinutes
                      }{" "}
                      min
                    </strong>
                  </div>
                </div>
  
                <div className="recommendation-reasons">
                  <h4>Why this action?</h4>
  
                  {selectedScenario.recommendation.reasoning.map(
                    (reason) => (
                      <div key={reason}>
                        <CheckCircle2 size={15} />
                        <span>{reason}</span>
                      </div>
                    ),
                  )}
                </div>
  
                <button
                  className={`dispatch-button ${
                    actionStarted ? "dispatch-button--active" : ""
                  }`}
                  type="button"
                  onClick={() => setActionStarted(true)}
                >
                  {actionStarted ? (
                    <>
                      <CheckCircle2 size={18} />
                      Enforcement team dispatched
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Create Enforcement Case
                    </>
                  )}
                </button>
  
                {actionStarted && (
                  <button
                    className="reset-action-button"
                    type="button"
                    onClick={() => setActionStarted(false)}
                  >
                    <RefreshCcw size={15} />
                    Reset demonstration
                  </button>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    );
  }
  
  export default Analysis;