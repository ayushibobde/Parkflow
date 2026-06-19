export interface DashboardAnalytics {
    totalViolations: number;
    topStation: [string, number];
    topVehicle: [string, number];
    topViolation: [string, number];
  }
  
  export interface Hotspot {
    location: string;
    policeStation: string;
    latitude: string;
    longitude: string;
    violations: number;
  }
  
  export interface HeatmapPoint {
    lat: number;
    lng: number;
    violationType: string;
    policeStation: string;
    location: string;
    junction: string;
  }