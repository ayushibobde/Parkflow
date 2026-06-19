import { Router } from "express";
import { getReportFromDataset } from "../services/datasetAnalytics.js";

const router = Router();
const allowedPeriods = new Set(["7d", "30d", "90d"]);

router.get("/", (req, res) => {
  const period = allowedPeriods.has(req.query.period)
    ? req.query.period
    : "7d";

  const report = getReportFromDataset(period);

  res.json({
    success: true,
    period,
    data: report,
  });
});

export default router;
