export type Priority = "Critical" | "High" | "Medium" | "Low";

export type IncidentStatus = "Unresolved" | "In Progress" | "Cleared";

export interface Incident {
  id: string;
  location: string;
  cameraId: string;
  illegalVehicles: number;
  laneBlockagePercent: number;
  trafficDensityPercent: number;
  baselineSpeed: number;
  currentSpeed: number;
  impactScore: number;
  priority: Priority;
  status: IncidentStatus;
  detectedAt: string;
}