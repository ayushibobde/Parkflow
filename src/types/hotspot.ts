import type { Priority } from "./incident";

export type HotspotStatus =
  | "Active"
  | "Under Enforcement"
  | "Monitoring"
  | "Cleared";

export interface Hotspot {
  id: string;
  name: string;
  zone: string;
  cameraId: string;

  latitude: number;
  longitude: number;

  priority: Priority;
  status: HotspotStatus;

  impactScore: number;
  illegalVehicles: number;
  laneBlockagePercent: number;
  trafficDensityPercent: number;

  baselineSpeed: number;
  currentSpeed: number;

  peakTime: string;
  recurringPattern: string;
  lastDetected: string;

  recommendedAction: string;
  officersRequired: number;
  towVehiclesRequired: number;
  estimatedClearanceMinutes: number;
}