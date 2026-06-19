import { Router } from "express";
import {
  getPatrolRoutesFromDataset,
  resetPatrolProgress,
  updatePatrolProgress,
} from "../services/datasetAnalytics.js";

const router = Router();

router.get("/", (req, res) => {
  const routes = getPatrolRoutesFromDataset();

  res.json({ success: true, data: routes });
});

router.patch("/:id/progress", (req, res) => {
  const {
    completedStopIds = [],
    routeStarted = false,
    isOptimized = false,
  } = req.body;

  if (!Array.isArray(completedStopIds)) {
    return res.status(400).json({
      success: false,
      message: "completedStopIds must be an array",
    });
  }

  const updated = updatePatrolProgress(req.params.id, {
    completedStopIds,
    routeStarted: Boolean(routeStarted),
    isOptimized: Boolean(isOptimized),
  });

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Patrol route not found",
    });
  }

  res.json({ success: true, data: updated });
});

router.post("/:id/reset", (req, res) => {
  const updated = resetPatrolProgress(req.params.id);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Patrol route not found",
    });
  }

  res.json({ success: true, data: updated });
});

export default router;
