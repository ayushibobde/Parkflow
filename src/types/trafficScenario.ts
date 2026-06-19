import type { Priority } from "./incident";

export interface DetectionBox {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  severity: "violation" | "normal";
}

export interface EnforcementRecommendation {
  action: string;
  officersRequired: number;
  towVehiclesRequired: number;
  monitoringDurationMinutes: number;
  reasoning: string[];
}

export interface TrafficScenario {
  id: string;
  name: string;
  location: string;
  cameraId: string;
  timestamp: string;
  description: string;
  image: string;
junction_name: string;
  vehiclesDetected: number;
  illegalVehicles: number;
  laneBlockagePercent: number;
  trafficDensityPercent: number;
  baselineSpeed: number;
  currentSpeed: number;
  parkingDurationMinutes: number;
  distanceFromIntersectionMeters: number;

  confidence: number;
  impactScore: number;
  priority: Priority;
  status: "Active" | "Monitoring" | "Cleared";

  detections: DetectionBox[];
  recommendation: EnforcementRecommendation;
}