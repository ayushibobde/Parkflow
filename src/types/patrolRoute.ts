import type { Priority } from "./incident";

export type PatrolStopStatus =
  | "Pending"
  | "Current"
  | "Completed";

export interface PatrolStop {
  id: string;
  location: string;
  zone: string;
  cameraId: string;

  latitude: number;
  longitude: number;

  originalOrder: number;
  optimizedOrder: number;

  impactScore: number;
  priority: Priority;
  illegalVehicles: number;

  estimatedServiceMinutes: number;
  recommendedAction: string;
}

export interface PatrolRoute {
  id: string;
  name: string;

  teamName: string;
  vehicleNumber: string;
  shift: string;

  startLocation: string;
  startLatitude: number;
  startLongitude: number;

  originalDistanceKm: number;
  optimizedDistanceKm: number;

  originalDurationMinutes: number;
  optimizedDurationMinutes: number;

  stops: PatrolStop[];
}