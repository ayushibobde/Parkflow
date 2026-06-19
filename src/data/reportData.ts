import type {
    AnalyticsReport,
    ReportPeriod,
  } from "../types/report";
  
  export const reportData: Record<ReportPeriod, AnalyticsReport> = {
    "7d": {
      summary: {
        totalViolations: 286,
        averageImpactScore: 68,
        clearanceRate: 84,
        averageClearanceMinutes: 27,
        speedImprovementPercent: 42,
        criticalHotspots: 6,
      },
  
      trends: [
        {
          label: "Mon",
          violations: 36,
          congestionScore: 61,
          clearedCases: 29,
        },
        {
          label: "Tue",
          violations: 43,
          congestionScore: 67,
          clearedCases: 36,
        },
        {
          label: "Wed",
          violations: 39,
          congestionScore: 64,
          clearedCases: 32,
        },
        {
          label: "Thu",
          violations: 48,
          congestionScore: 72,
          clearedCases: 39,
        },
        {
          label: "Fri",
          violations: 51,
          congestionScore: 76,
          clearedCases: 43,
        },
        {
          label: "Sat",
          violations: 42,
          congestionScore: 69,
          clearedCases: 37,
        },
        {
          label: "Sun",
          violations: 27,
          congestionScore: 55,
          clearedCases: 24,
        },
      ],
  
      locations: [
        {
          location: "Metro Station",
          violations: 58,
          impactScore: 91,
          averageClearanceMinutes: 25,
        },
        {
          location: "Railway Station",
          violations: 52,
          impactScore: 88,
          averageClearanceMinutes: 30,
        },
        {
          location: "Market Road",
          violations: 47,
          impactScore: 79,
          averageClearanceMinutes: 35,
        },
        {
          location: "Hospital",
          violations: 38,
          impactScore: 72,
          averageClearanceMinutes: 20,
        },
        {
          location: "School Zone",
          violations: 34,
          impactScore: 69,
          averageClearanceMinutes: 21,
        },
        {
          location: "Mall Junction",
          violations: 28,
          impactScore: 56,
          averageClearanceMinutes: 29,
        },
      ],
  
      hourlyViolations: [
        { hour: "6 AM", violations: 8 },
        { hour: "8 AM", violations: 22 },
        { hour: "10 AM", violations: 16 },
        { hour: "12 PM", violations: 19 },
        { hour: "2 PM", violations: 24 },
        { hour: "4 PM", violations: 31 },
        { hour: "6 PM", violations: 49 },
        { hour: "8 PM", violations: 42 },
        { hour: "10 PM", violations: 18 },
      ],
  
      priorityDistribution: [
        { name: "Critical", value: 18 },
        { name: "High", value: 34 },
        { name: "Medium", value: 31 },
        { name: "Low", value: 17 },
      ],
  
      statusDistribution: [
        { name: "Cleared", value: 84 },
        { name: "In Progress", value: 10 },
        { name: "Pending", value: 6 },
      ],
  
      speedImprovement: [
        { location: "Metro", before: 11, after: 31 },
        { location: "Railway", before: 12, after: 29 },
        { location: "Market", before: 15, after: 27 },
        { location: "Hospital", before: 17, after: 26 },
        { location: "School", before: 13, after: 23 },
      ],
    },
  
    "30d": {
      summary: {
        totalViolations: 1248,
        averageImpactScore: 65,
        clearanceRate: 81,
        averageClearanceMinutes: 29,
        speedImprovementPercent: 39,
        criticalHotspots: 9,
      },
  
      trends: [
        {
          label: "Week 1",
          violations: 286,
          congestionScore: 68,
          clearedCases: 240,
        },
        {
          label: "Week 2",
          violations: 318,
          congestionScore: 71,
          clearedCases: 254,
        },
        {
          label: "Week 3",
          violations: 337,
          congestionScore: 69,
          clearedCases: 270,
        },
        {
          label: "Week 4",
          violations: 307,
          congestionScore: 62,
          clearedCases: 247,
        },
      ],
  
      locations: [
        {
          location: "Metro Station",
          violations: 242,
          impactScore: 88,
          averageClearanceMinutes: 27,
        },
        {
          location: "Railway Station",
          violations: 219,
          impactScore: 84,
          averageClearanceMinutes: 32,
        },
        {
          location: "Market Road",
          violations: 194,
          impactScore: 77,
          averageClearanceMinutes: 36,
        },
        {
          location: "Hospital",
          violations: 158,
          impactScore: 70,
          averageClearanceMinutes: 23,
        },
        {
          location: "School Zone",
          violations: 146,
          impactScore: 68,
          averageClearanceMinutes: 22,
        },
        {
          location: "Mall Junction",
          violations: 132,
          impactScore: 54,
          averageClearanceMinutes: 31,
        },
      ],
  
      hourlyViolations: [
        { hour: "6 AM", violations: 32 },
        { hour: "8 AM", violations: 91 },
        { hour: "10 AM", violations: 68 },
        { hour: "12 PM", violations: 79 },
        { hour: "2 PM", violations: 102 },
        { hour: "4 PM", violations: 138 },
        { hour: "6 PM", violations: 212 },
        { hour: "8 PM", violations: 184 },
        { hour: "10 PM", violations: 73 },
      ],
  
      priorityDistribution: [
        { name: "Critical", value: 21 },
        { name: "High", value: 32 },
        { name: "Medium", value: 29 },
        { name: "Low", value: 18 },
      ],
  
      statusDistribution: [
        { name: "Cleared", value: 81 },
        { name: "In Progress", value: 12 },
        { name: "Pending", value: 7 },
      ],
  
      speedImprovement: [
        { location: "Metro", before: 12, after: 30 },
        { location: "Railway", before: 13, after: 28 },
        { location: "Market", before: 16, after: 27 },
        { location: "Hospital", before: 18, after: 26 },
        { location: "School", before: 14, after: 23 },
      ],
    },
  
    "90d": {
      summary: {
        totalViolations: 3612,
        averageImpactScore: 63,
        clearanceRate: 78,
        averageClearanceMinutes: 31,
        speedImprovementPercent: 37,
        criticalHotspots: 12,
      },
  
      trends: [
        {
          label: "Month 1",
          violations: 1124,
          congestionScore: 67,
          clearedCases: 883,
        },
        {
          label: "Month 2",
          violations: 1248,
          congestionScore: 65,
          clearedCases: 1011,
        },
        {
          label: "Month 3",
          violations: 1240,
          congestionScore: 58,
          clearedCases: 923,
        },
      ],
  
      locations: [
        {
          location: "Metro Station",
          violations: 684,
          impactScore: 85,
          averageClearanceMinutes: 29,
        },
        {
          location: "Railway Station",
          violations: 623,
          impactScore: 82,
          averageClearanceMinutes: 34,
        },
        {
          location: "Market Road",
          violations: 566,
          impactScore: 75,
          averageClearanceMinutes: 38,
        },
        {
          location: "Hospital",
          violations: 478,
          impactScore: 68,
          averageClearanceMinutes: 25,
        },
        {
          location: "School Zone",
          violations: 424,
          impactScore: 65,
          averageClearanceMinutes: 24,
        },
        {
          location: "Mall Junction",
          violations: 391,
          impactScore: 52,
          averageClearanceMinutes: 33,
        },
      ],
  
      hourlyViolations: [
        { hour: "6 AM", violations: 94 },
        { hour: "8 AM", violations: 264 },
        { hour: "10 AM", violations: 198 },
        { hour: "12 PM", violations: 226 },
        { hour: "2 PM", violations: 301 },
        { hour: "4 PM", violations: 402 },
        { hour: "6 PM", violations: 618 },
        { hour: "8 PM", violations: 529 },
        { hour: "10 PM", violations: 214 },
      ],
  
      priorityDistribution: [
        { name: "Critical", value: 23 },
        { name: "High", value: 31 },
        { name: "Medium", value: 28 },
        { name: "Low", value: 18 },
      ],
  
      statusDistribution: [
        { name: "Cleared", value: 78 },
        { name: "In Progress", value: 14 },
        { name: "Pending", value: 8 },
      ],
  
      speedImprovement: [
        { location: "Metro", before: 13, after: 29 },
        { location: "Railway", before: 14, after: 28 },
        { location: "Market", before: 17, after: 27 },
        { location: "Hospital", before: 18, after: 25 },
        { location: "School", before: 15, after: 23 },
      ],
    },
  };