import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Clock3,
    Download,
    FileSpreadsheet,
    Gauge,
    MapPin,
    ParkingCircle,
    ShieldCheck,
    TrendingUp,
  } from "lucide-react";
  import { useEffect, useMemo, useState } from "react";
  import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
  } from "recharts";
  import { parkFlowApi } from "../services/api";
  import type {
    AnalyticsReport,
    DistributionItem,
    ReportPeriod,
  } from "../types/report";
  
  interface ReportMetricProps {
    label: string;
    value: string | number;
    helper: string;
    change: string;
    positive?: boolean;
    icon: typeof Gauge;
  }
  
  const priorityColors: Record<string, string> = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#8b5cf6",
    Low: "#22c55e",
  };
  
  const statusColors: Record<string, string> = {
    Cleared: "#12b76a",
    "In Progress": "#2563eb",
    Pending: "#f79009",
  };
  
  function ReportMetric({
    label,
    value,
    helper,
    change,
    positive = true,
    icon: Icon,
  }: ReportMetricProps) {
    return (
      <article className="report-metric-card">
        <div className="report-metric-card__header">
          <div className="report-metric-card__icon">
            <Icon size={20} />
          </div>
  
          <span
            className={
              positive
                ? "report-metric-card__change report-metric-card__change--positive"
                : "report-metric-card__change report-metric-card__change--negative"
            }
          >
            {positive ? (
              <ArrowUp size={13} />
            ) : (
              <ArrowDown size={13} />
            )}
  
            {change}
          </span>
        </div>
  
        <span className="report-metric-card__label">{label}</span>
  
        <strong className="report-metric-card__value">{value}</strong>
  
        <small>{helper}</small>
      </article>
    );
  }
  
  interface DistributionLegendProps {
    data: DistributionItem[];
    colors: Record<string, string>;
  }
  
  function DistributionLegend({
    data,
    colors,
  }: DistributionLegendProps) {
    return (
      <div className="report-distribution-legend">
        {data.map((item) => (
          <div key={item.name}>
            <span
              className="report-distribution-legend__dot"
              style={{
                background: colors[item.name] ?? "#94a3b8",
              }}
            />
  
            <span>{item.name}</span>
  
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    );
  }
  
  function Reports() {
    const [selectedPeriod, setSelectedPeriod] =
      useState<ReportPeriod>("7d");
    const [report, setReport] = useState<AnalyticsReport | null>(
      null,
    );
    const [loading, setLoading] = useState(true);
  
    const [lastExportedAt, setLastExportedAt] = useState<
      string | null
    >(null);

    useEffect(() => {
      const loadReport = async () => {
        try {
          setLoading(true);

          const response = await parkFlowApi.getReports(
            selectedPeriod,
          );
          const data = (response as { data?: AnalyticsReport }).data;

          setReport(data ?? null);
        } catch (error) {
          console.error(error);
          setReport(null);
        } finally {
          setLoading(false);
        }
      };

      void loadReport();
    }, [selectedPeriod]);

    const highestImpactLocation = useMemo(() => {
      if (!report?.locations.length) {
        return null;
      }

      return [...report.locations].sort(
        (first, second) =>
          second.impactScore - first.impactScore,
      )[0];
    }, [report?.locations]);
  
    const peakHour = useMemo(() => {
      if (!report?.hourlyViolations.length) {
        return null;
      }

      return [...report.hourlyViolations].sort(
        (first, second) =>
          second.violations - first.violations,
      )[0];
    }, [report?.hourlyViolations]);

    if (loading) {
      return (
        <main className="reports-page">
          <h2>Loading reports...</h2>
        </main>
      );
    }

    if (!report) {
      return (
        <main className="reports-page">
          <h2>No report data available from dataset.</h2>
        </main>
      );
    }
  
    const averageSpeedBefore = report.speedImprovement.length
      ? Math.round(
          report.speedImprovement.reduce(
            (total, item) => total + item.before,
            0,
          ) / report.speedImprovement.length,
        )
      : 0;
  
    const averageSpeedAfter = report.speedImprovement.length
      ? Math.round(
          report.speedImprovement.reduce(
            (total, item) => total + item.after,
            0,
          ) / report.speedImprovement.length,
        )
      : 0;
  
    function exportCsv() {
      if (!report) {
        return;
      }

      const rows = [
        [
          "Location",
          "Violations",
          "Impact Score",
          "Average Clearance Minutes",
        ],
        ...report.locations.map((location) => [
          location.location,
          location.violations,
          location.impactScore,
          location.averageClearanceMinutes,
        ]),
      ];
  
      const csvContent = rows
        .map((row) =>
          row
            .map((value) => {
              const text = String(value).replace(/"/g, '""');
              return `"${text}"`;
            })
            .join(","),
        )
        .join("\n");
  
      const file = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
  
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
  
      link.href = downloadUrl;
      link.download = `parkflow-report-${selectedPeriod}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      URL.revokeObjectURL(downloadUrl);
  
      setLastExportedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
  
    return (
      <main className="reports-page">
        <header className="reports-header">
          <div>
            <p className="reports-header__eyebrow">
              Performance and Trend Intelligence
            </p>
  
            <h2>Reports & Analytics</h2>
  
            <p>
              Analyse parking violations, congestion impact,
              enforcement outcomes and traffic-flow improvement.
            </p>
          </div>
  
          <div className="reports-header__actions">
            <select
              aria-label="Select report period"
              value={selectedPeriod}
              onChange={(event) =>
                setSelectedPeriod(
                  event.target.value as ReportPeriod,
                )
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
  
            <button type="button" onClick={exportCsv}>
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </header>
  
        {lastExportedAt && (
          <section className="report-export-notice">
            <CheckCircle2 size={17} />
  
            <span>
              Report exported successfully at {lastExportedAt}.
            </span>
  
            <button
              type="button"
              onClick={() => setLastExportedAt(null)}
              aria-label="Dismiss export message"
            >
              ×
            </button>
          </section>
        )}
  
        <section className="report-metrics-grid">
          <ReportMetric
            label="Total violations"
            value={report.summary.totalViolations.toLocaleString()}
            helper="Detected parking violations"
            change="12.4%"
            icon={ParkingCircle}
          />
  
          <ReportMetric
            label="Average impact score"
            value={`${report.summary.averageImpactScore}/100`}
            helper="Across monitored locations"
            change="3.8%"
            positive={false}
            icon={Gauge}
          />
  
          <ReportMetric
            label="Clearance rate"
            value={`${report.summary.clearanceRate}%`}
            helper="Cases resolved successfully"
            change="6.2%"
            icon={CheckCircle2}
          />
  
          <ReportMetric
            label="Average clearance time"
            value={`${report.summary.averageClearanceMinutes} min`}
            helper="From dispatch to completion"
            change="8.1%"
            positive={false}
            icon={Clock3}
          />
  
          <ReportMetric
            label="Speed improvement"
            value={`${report.summary.speedImprovementPercent}%`}
            helper="After parking clearance"
            change="9.3%"
            icon={TrendingUp}
          />
  
          <ReportMetric
            label="Critical hotspots"
            value={report.summary.criticalHotspots}
            helper="Requiring recurring action"
            change="2 locations"
            positive={false}
            icon={AlertTriangle}
          />
        </section>
  
        <section className="reports-primary-grid">
          <article className="report-panel report-panel--large">
            <div className="report-panel__header">
              <div>
                <h3>Violation and Congestion Trend</h3>
                <p>
                  Violation volume compared with average congestion
                  impact.
                </p>
              </div>
  
              <div className="report-panel__badge">
                <Activity size={15} />
                Trend analysis
              </div>
            </div>
  
            <div className="report-chart report-chart--large">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={report.trends}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="violationsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#2563eb"
                        stopOpacity={0.34}
                      />
  
                      <stop
                        offset="95%"
                        stopColor="#2563eb"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
  
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
  
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
  
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
  
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e4e7ec",
                    }}
                  />
  
                  <Legend />
  
                  <Area
                    type="monotone"
                    dataKey="violations"
                    name="Violations"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#violationsGradient)"
                  />
  
                  <Line
                    type="monotone"
                    dataKey="congestionScore"
                    name="Congestion score"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
  
          <article className="report-panel">
            <div className="report-panel__header">
              <div>
                <h3>Priority Distribution</h3>
                <p>Share of cases by enforcement priority.</p>
              </div>
            </div>
  
            <div className="report-donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.priorityDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {report.priorityDistribution.map((item) => (
                      <Cell
                        key={item.name}
                        fill={
                          priorityColors[item.name] ?? "#94a3b8"
                        }
                      />
                    ))}
                  </Pie>
  
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
  
              <div className="report-donut-chart__center">
                <strong>100%</strong>
                <span>All cases</span>
              </div>
            </div>
  
            <DistributionLegend
              data={report.priorityDistribution}
              colors={priorityColors}
            />
          </article>
        </section>
  
        <section className="reports-secondary-grid">
          <article className="report-panel">
            <div className="report-panel__header">
              <div>
                <h3>Hotspot Performance</h3>
                <p>
                  Violations and congestion impact by location.
                </p>
              </div>
  
              <MapPin size={20} />
            </div>
  
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.locations}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 15,
                    left: 20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
  
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
  
                  <YAxis
                    type="category"
                    dataKey="location"
                    tickLine={false}
                    axisLine={false}
                    width={95}
                    fontSize={9}
                  />
  
                  <Tooltip />
  
                  <Bar
                    dataKey="impactScore"
                    name="Impact Score"
                    fill="#2563eb"
                    radius={[0, 7, 7, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
  
          <article className="report-panel">
            <div className="report-panel__header">
              <div>
                <h3>Peak Violation Hours</h3>
                <p>
                  Parking incidents detected throughout the day.
                </p>
              </div>
  
              <Clock3 size={20} />
            </div>
  
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.hourlyViolations}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
  
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                  />
  
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                  />
  
                  <Tooltip />
  
                  <Bar
                    dataKey="violations"
                    name="Violations"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
  
        <section className="reports-secondary-grid">
          <article className="report-panel">
            <div className="report-panel__header">
              <div>
                <h3>Traffic Speed Improvement</h3>
                <p>
                  Average speed before and after enforcement.
                </p>
              </div>
  
              <TrendingUp size={20} />
            </div>
  
            <div className="report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.speedImprovement}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
  
                  <XAxis
                    dataKey="location"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                  />
  
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                    unit=" km/h"
                  />
  
                  <Tooltip />
  
                  <Legend />
  
                  <Bar
                    dataKey="before"
                    name="Before"
                    fill="#f04438"
                    radius={[5, 5, 0, 0]}
                  />
  
                  <Bar
                    dataKey="after"
                    name="After"
                    fill="#12b76a"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
  
          <article className="report-panel">
            <div className="report-panel__header">
              <div>
                <h3>Enforcement Status</h3>
                <p>
                  Current distribution of enforcement outcomes.
                </p>
              </div>
  
              <ShieldCheck size={20} />
            </div>
  
            <div className="report-donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {report.statusDistribution.map((item) => (
                      <Cell
                        key={item.name}
                        fill={
                          statusColors[item.name] ?? "#94a3b8"
                        }
                      />
                    ))}
                  </Pie>
  
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
  
              <div className="report-donut-chart__center">
                <strong>
                  {report.summary.clearanceRate}%
                </strong>
                <span>Cleared</span>
              </div>
            </div>
  
            <DistributionLegend
              data={report.statusDistribution}
              colors={statusColors}
            />
          </article>
        </section>
  
        <section className="report-insights-grid">
          <article className="report-insight-card">
            <div className="report-insight-card__icon report-insight-card__icon--danger">
              <AlertTriangle size={21} />
            </div>
  
            <div>
              <span>Highest-impact hotspot</span>
              <strong>{highestImpactLocation?.location ?? "N/A"}</strong>
  
              <p>
                Impact score {highestImpactLocation?.impactScore ?? 0}/100
                with {highestImpactLocation?.violations ?? 0} parking
                violations.
              </p>
            </div>
          </article>
  
          <article className="report-insight-card">
            <div className="report-insight-card__icon report-insight-card__icon--warning">
              <Clock3 size={21} />
            </div>
  
            <div>
              <span>Peak violation period</span>
              <strong>{peakHour?.hour ?? "N/A"}</strong>
  
              <p>
                {peakHour?.violations ?? 0} violations were detected during
                this reporting period.
              </p>
            </div>
          </article>
  
          <article className="report-insight-card">
            <div className="report-insight-card__icon report-insight-card__icon--success">
              <TrendingUp size={21} />
            </div>
  
            <div>
              <span>Average speed recovery</span>
              <strong>
                {averageSpeedBefore} km/h → {averageSpeedAfter} km/h
              </strong>
  
              <p>
                Targeted enforcement produces measurable traffic-flow
                improvement.
              </p>
            </div>
          </article>
        </section>
  
        <section className="report-download-panel">
          <div className="report-download-panel__icon">
            <FileSpreadsheet size={25} />
          </div>
  
          <div>
            <span>Operational report</span>
  
            <strong>
              ParkFlow parking-congestion intelligence report
            </strong>
  
            <p>
              Export location-level violation counts, congestion scores
              and enforcement performance as a CSV file.
            </p>
          </div>
  
          <button type="button" onClick={exportCsv}>
            <Download size={17} />
            Download report
          </button>
        </section>
      </main>
    );
  }
  
  export default Reports;