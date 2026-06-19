import { Router } from "express";
import {
  getTrafficScenarioByIdFromDataset,
  getTrafficScenariosFromDataset,
} from "../services/datasetAnalytics.js";

const router = Router();

router.get("/", (req, res) => {
  const scenarios = getTrafficScenariosFromDataset();

  res.json({ success: true, data: scenarios });
});

router.post("/:id/analyze", (req, res) => {
  const scenario = getTrafficScenarioByIdFromDataset(req.params.id);

  if (!scenario) {
    return res.status(404).json({
      success: false,
      message: "Traffic scenario not found",
    });
  }

  res.json({
    success: true,
    mode: "dataset-derived",
    generatedAt: new Date().toISOString(),
    data: scenario,
  });
});

export default router;
