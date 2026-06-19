import express from "express";
import { getRecords } from "../services/datasetService.js";

const router = express.Router();

/**
 * Dashboard Metrics
 */
router.get("/dashboard", (req, res) => {
  const records = getRecords();

  const policeStations = {};
  const vehicleTypes = {};
  const violationTypes = {};

  records.forEach((row) => {
    const station = row.police_station || "Unknown";
    const vehicle = row.vehicle_type || "Unknown";
    const violation = row.violation_type || "Unknown";

    policeStations[station] =
      (policeStations[station] || 0) + 1;

    vehicleTypes[vehicle] =
      (vehicleTypes[vehicle] || 0) + 1;

    violationTypes[violation] =
      (violationTypes[violation] || 0) + 1;
  });

  const topStation = Object.entries(policeStations)
    .sort((a, b) => b[1] - a[1])[0];

  const topVehicle = Object.entries(vehicleTypes)
    .sort((a, b) => b[1] - a[1])[0];

  const topViolation = Object.entries(violationTypes)
    .sort((a, b) => b[1] - a[1])[0];

  res.json({
    totalViolations: records.length,
    topStation,
    topVehicle,
    topViolation,
  });
});

/**
 * Top Hotspots
 */
router.get("/hotspots", (req, res) => {
  const records = getRecords();

  const hotspots = {};

  records.forEach((row) => {
    const key =
      row.junction_name ||
      row.location ||
      "Unknown";

    if (!hotspots[key]) {
      hotspots[key] = {
        location: key,
        policeStation: row.police_station || "Unknown",
        latitude: row.latitude,
        longitude: row.longitude,
        violations: 0,
      };
    }

    hotspots[key].violations++;
  });

  const result = Object.values(hotspots)
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 20);

  res.json(result);
});

/**
 * Heatmap Data
 */
router.get("/heatmap", (req, res) => {
  const records = getRecords();

  const heatmapData = records
    .filter(
      (row) =>
        row.latitude &&
        row.longitude
    )
    .map((row) => ({
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      violationType: row.violation_type,
      policeStation: row.police_station,
      location: row.location,
      junction: row.junction_name,
    }));

  res.json(heatmapData);
});

export default router;