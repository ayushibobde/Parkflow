export type ReportPeriod = "7d" | "30d" | "90d";

export interface TrendDataPoint {
  label: string;
  violations: number;
  congestionScore: number;
  clearedCases: number;
}

export interface LocationPerformance {
  location: string;
  violations: number;
  impactScore: number;
  averageClearanceMinutes: number;
}

export interface HourlyViolation {
  hour: string;
  violations: number;
}

export interface DistributionItem {
  name: string;
  value: number;
}

export interface SpeedImprovementData {
  location: string;
  before: number;
  after: number;
}

export interface ReportSummary {
  totalViolations: number;
  averageImpactScore: number;
  clearanceRate: number;
  averageClearanceMinutes: number;
  speedImprovementPercent: number;
  criticalHotspots: number;
}

export interface AnalyticsReport {
  summary: ReportSummary;
  trends: TrendDataPoint[];
  locations: LocationPerformance[];
  hourlyViolations: HourlyViolation[];
  priorityDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  speedImprovement: SpeedImprovementData[];
}