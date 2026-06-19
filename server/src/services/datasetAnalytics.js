import { getRecords } from "./datasetService.js";

const enforcementStatusOverrides = new Map();
const patrolProgressOverrides = new Map();
let cachedLocations = null;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = [
  "6 AM",
  "8 AM",
  "10 AM",
  "12 PM",
  "2 PM",
  "4 PM",
  "6 PM",
  "8 PM",
  "10 PM",
];
const HOUR_BUCKETS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

const DEFAULT_STATUSES = ["Pending", "Dispatched", "On Site", "Cleared"];
const ASSIGNED_UNITS = [
  "Traffic Unit Alpha",
  "Traffic Unit Bravo",
  "Traffic Unit Delta",
  "Traffic Unit Echo",
];

export function initializeDerivedData() {
  enforcementStatusOverrides.clear();
  patrolProgressOverrides.clear();
  cachedLocations = null;
}

function getAggregatedLocations() {
  if (!cachedLocations) {
    cachedLocations = aggregateLocations(getRecords());
  }

  return cachedLocations;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(" ", "T")
    .replace(/\+00$/, "Z");

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseViolationTypes(row) {
  const raw = row.violation_type;

  if (!raw) {
    return ["Unknown"];
  }

  try {
    const normalized = raw.replace(/""/g, '"');
    const parsed = JSON.parse(normalized);

    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return [String(raw)];
  }
}

function getLocationName(row) {
  if (row.junction_name && row.junction_name !== "No Junction") {
    return row.junction_name.replace(/^BTP\d+\s*-\s*/i, "").trim();
  }

  const location = row.location || "Unknown";

  return location.split(",")[0].trim().slice(0, 100);
}

function getLocationKey(row) {
  const junction =
    row.junction_name && row.junction_name !== "No Junction"
      ? row.junction_name
      : null;

  const latitude = Number(row.latitude).toFixed(4);
  const longitude = Number(row.longitude).toFixed(4);

  return junction
    ? `${junction}|${latitude}|${longitude}`
    : `${getLocationName(row)}|${latitude}|${longitude}`;
}

function violationsToImpactScore(count) {
  if (count >= 1000) {
    return 95;
  }

  if (count >= 500) {
    return 91;
  }

  if (count >= 200) {
    return 88;
  }

  if (count >= 100) {
    return 79;
  }

  if (count >= 50) {
    return 72;
  }

  if (count >= 25) {
    return 65;
  }

  if (count >= 10) {
    return 56;
  }

  return Math.min(50, 35 + count);
}

function impactScoreToPriority(score) {
  if (score >= 90) {
    return "Critical";
  }

  if (score >= 75) {
    return "High";
  }

  if (score >= 55) {
    return "Medium";
  }

  return "Low";
}

function deriveTrafficMetrics(violationCount, uniqueVehicleCount) {
  const illegalVehicles = Math.min(
    uniqueVehicleCount || violationCount,
    20,
  );
  const laneBlockagePercent = Math.min(
    95,
    Math.round(15 + violationCount / 15),
  );
  const trafficDensityPercent = Math.min(
    99,
    Math.round(40 + violationCount / 12),
  );
  const baselineSpeed = 38;
  const currentSpeed = Math.max(
    8,
    Math.round(baselineSpeed - violationCount / 25),
  );
  const predictedClearedSpeed = Math.min(
    baselineSpeed - 2,
    currentSpeed + Math.round(laneBlockagePercent / 3),
  );

  return {
    illegalVehicles,
    laneBlockagePercent,
    trafficDensityPercent,
    baselineSpeed,
    currentSpeed,
    predictedClearedSpeed,
    officersRequired:
      illegalVehicles >= 7 ? 3 : illegalVehicles >= 4 ? 2 : 1,
    towVehiclesRequired: illegalVehicles >= 6 ? 1 : 0,
    estimatedClearanceMinutes:
      15 + illegalVehicles * 3 + Math.round(laneBlockagePercent / 4),
  };
}

function buildRecommendedAction(priority, violationTypes) {
  const primaryViolation = violationTypes[0] || "illegal parking";

  if (priority === "Critical") {
    return `Immediate towing and lane clearance for ${primaryViolation.toLowerCase()}`;
  }

  if (priority === "High") {
    return `Deploy officers to clear ${primaryViolation.toLowerCase()} violations`;
  }

  return `Monitor and warn vehicles for ${primaryViolation.toLowerCase()}`;
}

function formatRelativeTime(date) {
  if (!date) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function getPeakHourLabel(hourCounts) {
  let peakHour = 18;
  let peakCount = 0;

  hourCounts.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });

  const start = peakHour % 12 || 12;
  const startPeriod = peakHour >= 12 ? "PM" : "AM";
  const endHour = (peakHour + 2) % 24;
  const end = endHour % 12 || 12;
  const endPeriod = endHour >= 12 ? "PM" : "AM";

  return `${start}:00 ${startPeriod} – ${end}:00 ${endPeriod}`;
}

function aggregateLocations(records) {
  const locations = new Map();

  records.forEach((row) => {
    const key = getLocationKey(row);

    if (!locations.has(key)) {
      locations.set(key, {
        key,
        name: getLocationName(row),
        zone: row.police_station || "Unknown",
        cameraId: row.device_id
          ? `CAM-${row.device_id}`
          : "CAM-UNKNOWN",
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        violations: 0,
        vehicles: new Set(),
        violationTypes: new Map(),
        hourCounts: new Map(),
        records: [],
        latestDate: null,
      });
    }

    const location = locations.get(key);

    location.violations += 1;
    location.vehicles.add(row.vehicle_number || row.id);
    location.records.push(row);

    parseViolationTypes(row).forEach((type) => {
      location.violationTypes.set(
        type,
        (location.violationTypes.get(type) || 0) + 1,
      );
    });

    const createdAt = parseDate(row.created_datetime);

    if (createdAt) {
      const hour = createdAt.getHours();

      location.hourCounts.set(
        hour,
        (location.hourCounts.get(hour) || 0) + 1,
      );

      if (!location.latestDate || createdAt > location.latestDate) {
        location.latestDate = createdAt;
      }
    }
  });

  return [...locations.values()]
    .filter(
      (location) =>
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude),
    )
    .map((location, index) => {
      const impactScore = violationsToImpactScore(location.violations);
      const priority = impactScoreToPriority(impactScore);
      const metrics = deriveTrafficMetrics(
        location.violations,
        location.vehicles.size,
      );
      const topViolationType = [...location.violationTypes.entries()].sort(
        (first, second) => second[1] - first[1],
      )[0]?.[0];

      return {
        id: `HOT-${String(index + 1).padStart(3, "0")}`,
        name: location.name,
        zone: location.zone,
        cameraId: location.cameraId,
        latitude: location.latitude,
        longitude: location.longitude,
        violations: location.violations,
        priority,
        status:
          priority === "Critical" || priority === "High"
            ? "Active"
            : "Monitoring",
        impactScore,
        peakTime: getPeakHourLabel(location.hourCounts),
        recurringPattern: `${location.zone} enforcement zone`,
        lastDetected: formatRelativeTime(location.latestDate),
        latestDate: location.latestDate,
        recommendedAction: buildRecommendedAction(priority, [
          topViolationType,
        ]),
        topViolationType,
        sampleRecords: location.records.slice(0, 8),
        ...metrics,
      };
    })
    .sort((first, second) => second.impactScore - first.impactScore);
}

function getMaxDatasetDate(records) {
  return records.reduce((maxDate, row) => {
    const parsed = parseDate(row.created_datetime);

    if (!parsed) {
      return maxDate;
    }

    return !maxDate || parsed > maxDate ? parsed : maxDate;
  }, null);
}

function filterRecordsByPeriod(records, period) {
  const maxDate = getMaxDatasetDate(records) || new Date();
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;
  const startDate = new Date(maxDate);

  startDate.setDate(startDate.getDate() - days);

  return records.filter((row) => {
    const createdAt = parseDate(row.created_datetime);

    return createdAt && createdAt >= startDate && createdAt <= maxDate;
  });
}

function haversineDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2,
) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDetections(sampleRecords) {
  return sampleRecords.slice(0, 5).map((row, index) => ({
    id: `DET-${String(index + 1).padStart(3, "0")}`,
    label: parseViolationTypes(row)[0] || "Illegal Parking",
    confidence: Math.min(0.98, 0.86 + index * 0.02),
    x: 8 + index * 17,
    y: 44 + (index % 2) * 6,
    width: 16 + (index % 3) * 2,
    height: 22 + (index % 2) * 3,
    severity: "violation",
  }));
}

function buildTrafficScenario(hotspot, index) {
  const timestamp = hotspot.latestDate
    ? hotspot.latestDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Live";

  return {
    id: `SCN-${String(index + 1).padStart(3, "0")}`,
    name: `${hotspot.name} — Live Feed`,
    location: hotspot.name,
    cameraId: hotspot.cameraId,
    timestamp,
    description: `${hotspot.violations} parking violations recorded at ${hotspot.name} under ${hotspot.zone} jurisdiction.`,
    image: "/images/metro-station.jpg",
    vehiclesDetected: Math.max(
      hotspot.illegalVehicles + 8,
      hotspot.illegalVehicles,
    ),
    illegalVehicles: hotspot.illegalVehicles,
    laneBlockagePercent: hotspot.laneBlockagePercent,
    trafficDensityPercent: hotspot.trafficDensityPercent,
    baselineSpeed: hotspot.baselineSpeed,
    currentSpeed: hotspot.currentSpeed,
    parkingDurationMinutes: Math.min(
      90,
      20 + hotspot.illegalVehicles * 4,
    ),
    distanceFromIntersectionMeters:
      hotspot.name.includes("Junction") ? 25 : 60,
    confidence: Math.min(0.98, 0.82 + hotspot.impactScore / 500),
    impactScore: hotspot.impactScore,
    priority: hotspot.priority,
    status: "Active",
    detections: buildDetections(hotspot.sampleRecords),
    recommendation: {
      action: hotspot.recommendedAction,
      officersRequired: hotspot.officersRequired,
      towVehiclesRequired: hotspot.towVehiclesRequired,
      monitoringDurationMinutes: 60 + hotspot.estimatedClearanceMinutes,
      reasoning: [
        `${hotspot.laneBlockagePercent}% of available lane capacity is affected.`,
        `Traffic speed has fallen from ${hotspot.baselineSpeed} km/h to ${hotspot.currentSpeed} km/h.`,
        `${hotspot.illegalVehicles} violating vehicles were detected in recent records.`,
        `Peak activity occurs during ${hotspot.peakTime}.`,
      ],
    },
  };
}

function buildPatrolRoutes(hotspots) {
  const routesByZone = new Map();

  hotspots.slice(0, 40).forEach((hotspot) => {
    if (!routesByZone.has(hotspot.zone)) {
      routesByZone.set(hotspot.zone, []);
    }

    routesByZone.get(hotspot.zone).push(hotspot);
  });

  return [...routesByZone.entries()]
    .filter(([, zoneHotspots]) => zoneHotspots.length >= 2)
    .slice(0, 4)
    .map(([zone, zoneHotspots], routeIndex) => {
      const stops = zoneHotspots.slice(0, 5).map((hotspot, stopIndex) => ({
        id: `STOP-${routeIndex + 1}${stopIndex + 1}`,
        location: hotspot.name,
        zone: hotspot.zone,
        cameraId: hotspot.cameraId,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        originalOrder: stopIndex + 1,
        optimizedOrder: stopIndex + 1,
        impactScore: hotspot.impactScore,
        priority: hotspot.priority,
        illegalVehicles: hotspot.illegalVehicles,
        estimatedServiceMinutes: hotspot.estimatedClearanceMinutes,
        recommendedAction: hotspot.recommendedAction,
      }));

      stops.sort(
        (first, second) => second.impactScore - first.impactScore,
      );

      stops.forEach((stop, index) => {
        stop.optimizedOrder = index + 1;
      });

      const startLatitude = stops[0].latitude;
      const startLongitude = stops[0].longitude;
      const orderedPoints = [
        [startLatitude, startLongitude],
        ...stops.map((stop) => [stop.latitude, stop.longitude]),
      ];

      let originalDistanceKm = 0;

      for (let index = 1; index < orderedPoints.length; index += 1) {
        originalDistanceKm += haversineDistanceKm(
          orderedPoints[index - 1][0],
          orderedPoints[index - 1][1],
          orderedPoints[index][0],
          orderedPoints[index][1],
        );
      }

      const optimizedDistanceKm = originalDistanceKm * 0.72;
      const originalDurationMinutes = Math.round(
        originalDistanceKm * 4 +
          stops.reduce(
            (total, stop) => total + stop.estimatedServiceMinutes,
            0,
          ),
      );
      const optimizedDurationMinutes = Math.round(
        optimizedDistanceKm * 4 +
          stops.reduce(
            (total, stop) => total + stop.estimatedServiceMinutes,
            0,
          ),
      );

      const routeId = `ROUTE-${String(routeIndex + 1).padStart(3, "0")}`;
      const savedProgress = patrolProgressOverrides.get(routeId);

      return {
        id: routeId,
        name: `${zone} Priority Route`,
        teamName: ASSIGNED_UNITS[routeIndex % ASSIGNED_UNITS.length],
        vehicleNumber: `KA-01-TF-${2100 + routeIndex}`,
        shift: "Evening Shift · 4:00 PM – 10:00 PM",
        startLocation: `${zone} Traffic Division`,
        startLatitude,
        startLongitude,
        originalDistanceKm: Number(originalDistanceKm.toFixed(1)),
        optimizedDistanceKm: Number(optimizedDistanceKm.toFixed(1)),
        originalDurationMinutes,
        optimizedDurationMinutes,
        progress: savedProgress || {
          completedStopIds: [],
          routeStarted: false,
          isOptimized: false,
        },
        stops,
      };
    });
}

function buildEnforcementCases(hotspots) {
  return hotspots.slice(0, 12).map((hotspot, index) => {
    const id = `ENF-${String(index + 1).padStart(3, "0")}`;
    const defaultStatus =
      DEFAULT_STATUSES[index % DEFAULT_STATUSES.length];

    return {
      id,
      hotspotId: hotspot.id,
      location: hotspot.name,
      zone: hotspot.zone,
      cameraId: hotspot.cameraId,
      priority: hotspot.priority,
      status: enforcementStatusOverrides.get(id) || defaultStatus,
      impactScore: hotspot.impactScore,
      illegalVehicles: hotspot.illegalVehicles,
      laneBlockagePercent: hotspot.laneBlockagePercent,
      baselineSpeed: hotspot.baselineSpeed,
      currentSpeed: hotspot.currentSpeed,
      predictedClearedSpeed: hotspot.predictedClearedSpeed,
      officersRequired: hotspot.officersRequired,
      towVehiclesRequired: hotspot.towVehiclesRequired,
      estimatedClearanceMinutes: hotspot.estimatedClearanceMinutes,
      recommendedAction: hotspot.recommendedAction,
      reason: `${hotspot.illegalVehicles} violations recorded at ${hotspot.name}, causing significant congestion during ${hotspot.peakTime}.`,
      assignedUnit: ASSIGNED_UNITS[index % ASSIGNED_UNITS.length],
      detectedAt: hotspot.lastDetected,
      updatedAt: new Date().toISOString(),
    };
  });
}

function buildReport(period) {
  const records = getRecords();
  const filteredRecords = filterRecordsByPeriod(records, period);
  const hotspots = aggregateLocations(filteredRecords);
  const totalViolations = filteredRecords.length;
  const averageImpactScore = hotspots.length
    ? Math.round(
        hotspots.reduce(
          (total, hotspot) => total + hotspot.impactScore,
          0,
        ) / hotspots.length,
      )
    : 0;
  const criticalHotspots = hotspots.filter(
    (hotspot) => hotspot.priority === "Critical",
  ).length;

  const dayBuckets = DAY_LABELS.map((label) => ({
    label,
    violations: 0,
    congestionScore: 0,
    clearedCases: 0,
  }));

  filteredRecords.forEach((row) => {
    const createdAt = parseDate(row.created_datetime);

    if (!createdAt) {
      return;
    }

    const bucket = dayBuckets[createdAt.getDay()];

    bucket.violations += 1;
    bucket.congestionScore += violationsToImpactScore(1);
    bucket.clearedCases +=
      row.validation_status === "approved" ? 1 : 0;
  });

  dayBuckets.forEach((bucket) => {
    if (bucket.violations > 0) {
      bucket.congestionScore = Math.round(
        bucket.congestionScore / bucket.violations,
      );
      bucket.clearedCases = Math.min(
        bucket.clearedCases,
        bucket.violations,
      );
    }
  });

  const hourCounts = new Map(
    HOUR_BUCKETS.map((hour) => [hour, 0]),
  );

  filteredRecords.forEach((row) => {
    const createdAt = parseDate(row.created_datetime);

    if (!createdAt) {
      return;
    }

    const hour = createdAt.getHours();
    const nearestBucket = HOUR_BUCKETS.reduce((closest, bucketHour) =>
      Math.abs(bucketHour - hour) < Math.abs(closest - hour)
        ? bucketHour
        : closest,
    HOUR_BUCKETS[0]);

    hourCounts.set(
      nearestBucket,
      (hourCounts.get(nearestBucket) || 0) + 1,
    );
  });

  const priorityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  hotspots.forEach((hotspot) => {
    priorityCounts[hotspot.priority] += 1;
  });

  const statusCounts = {
    Cleared: 0,
    "In Progress": 0,
    Pending: 0,
  };

  filteredRecords.forEach((row) => {
    if (row.validation_status === "approved") {
      statusCounts.Cleared += 1;
    } else if (row.validation_status === "rejected") {
      statusCounts.Pending += 1;
    } else {
      statusCounts["In Progress"] += 1;
    }
  });

  const statusTotal = Object.values(statusCounts).reduce(
    (total, value) => total + value,
    0,
  );

  const priorityTotal = Object.values(priorityCounts).reduce(
    (total, value) => total + value,
    0,
  );

  const toPercent = (value, total) =>
    total ? Math.round((value / total) * 100) : 0;

  const locations = hotspots.slice(0, 8).map((hotspot) => ({
    location: hotspot.name,
    violations: hotspot.violations,
    impactScore: hotspot.impactScore,
    averageClearanceMinutes: hotspot.estimatedClearanceMinutes,
  }));

  const speedImprovement = hotspots.slice(0, 6).map((hotspot) => ({
    location: hotspot.name.slice(0, 24),
    before: hotspot.currentSpeed,
    after: hotspot.predictedClearedSpeed,
  }));

  const clearedCount = statusCounts.Cleared;

  return {
    summary: {
      totalViolations,
      averageImpactScore,
      clearanceRate: toPercent(clearedCount, totalViolations),
      averageClearanceMinutes: locations.length
        ? Math.round(
            locations.reduce(
              (total, location) =>
                total + location.averageClearanceMinutes,
              0,
            ) / locations.length,
          )
        : 0,
      speedImprovementPercent: speedImprovement.length
        ? Math.round(
            speedImprovement.reduce((total, item) => {
              const improvement =
                ((item.after - item.before) / item.before) * 100;

              return total + improvement;
            }, 0) / speedImprovement.length,
          )
        : 0,
      criticalHotspots,
    },
    trends: dayBuckets,
    locations,
    hourlyViolations: HOUR_BUCKETS.map((hour, index) => ({
      hour: HOUR_LABELS[index],
      violations: hourCounts.get(hour) || 0,
    })),
    priorityDistribution: Object.entries(priorityCounts).map(
      ([name, value]) => ({
        name,
        value: toPercent(value, priorityTotal),
      }),
    ),
    statusDistribution: Object.entries(statusCounts).map(
      ([name, value]) => ({
        name,
        value: toPercent(value, statusTotal),
      }),
    ),
    speedImprovement,
  };
}

export function getHotspotsFromDataset(filters = {}) {
  const hotspots = getAggregatedLocations();
  const { priority, status, search } = filters;
  const query = String(search ?? "").trim().toLowerCase();

  return hotspots.filter((hotspot) => {
    const matchesPriority =
      !priority || hotspot.priority === priority;
    const matchesStatus = !status || hotspot.status === status;
    const matchesSearch =
      !query ||
      hotspot.name.toLowerCase().includes(query) ||
      hotspot.zone.toLowerCase().includes(query) ||
      hotspot.cameraId.toLowerCase().includes(query);

    return matchesPriority && matchesStatus && matchesSearch;
  }).slice(0, 100);
}

export function getHotspotByIdFromDataset(id) {
  return getHotspotsFromDataset().find((hotspot) => hotspot.id === id);
}

export function getTrafficScenariosFromDataset() {
  return getAggregatedLocations()
    .slice(0, 8)
    .map((hotspot, index) => buildTrafficScenario(hotspot, index));
}

export function getTrafficScenarioByIdFromDataset(id) {
  return getTrafficScenariosFromDataset().find(
    (scenario) => scenario.id === id,
  );
}

export function getEnforcementCasesFromDataset() {
  return buildEnforcementCases(getAggregatedLocations());
}

export function updateEnforcementStatus(id, status) {
  const existingCase = getEnforcementCasesFromDataset().find(
    (item) => item.id === id,
  );

  if (!existingCase) {
    return null;
  }

  enforcementStatusOverrides.set(id, status);

  return {
    ...existingCase,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export function getPatrolRoutesFromDataset() {
  return buildPatrolRoutes(getAggregatedLocations());
}

export function updatePatrolProgress(id, progress) {
  const route = getPatrolRoutesFromDataset().find((item) => item.id === id);

  if (!route) {
    return null;
  }

  const nextProgress = {
    ...route.progress,
    ...progress,
    updatedAt: new Date().toISOString(),
  };

  patrolProgressOverrides.set(id, nextProgress);

  return {
    ...route,
    progress: nextProgress,
  };
}

export function resetPatrolProgress(id) {
  return updatePatrolProgress(id, {
    completedStopIds: [],
    routeStarted: false,
    isOptimized: false,
  });
}

export function getReportFromDataset(period = "7d") {
  return buildReport(period);
}
