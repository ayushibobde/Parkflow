import type { Priority } from "./incident";

export type EnforcementStatus =
  | "Pending"
  | "Dispatched"
  | "On Site"
  | "Cleared";

export interface EnforcementCase {
  id: string;
  hotspotId: string;
  location: string;
  zone: string;
  cameraId: string;
junction_name?: string;
  priority: Priority;
  status: EnforcementStatus;
  impactScore: number;
latitude?: number;
  longitude?: number;
  illegalVehicles: number;
  laneBlockagePercent: number;

  baselineSpeed: number;
  currentSpeed: number;
  predictedClearedSpeed: number;

  officersRequired: number;
  towVehiclesRequired: number;
  estimatedClearanceMinutes: number;

  recommendedAction: string;
  reason: string;
  assignedUnit: string;
  detectedAt: string;
}