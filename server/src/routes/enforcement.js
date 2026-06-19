import { Router } from "express";
import {
  getEnforcementCasesFromDataset,
  updateEnforcementStatus,
} from "../services/datasetAnalytics.js";

const router = Router();
const allowedStatuses = new Set([
  "Pending",
  "Dispatched",
  "On Site",
  "Cleared",
]);

router.get("/", (req, res) => {
  const cases = getEnforcementCasesFromDataset();

  res.json({ success: true, data: cases });
});

router.patch("/:id/status", (req, res) => {
  const { status } = req.body;

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid enforcement status",
    });
  }

  const updated = updateEnforcementStatus(req.params.id, status);

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Enforcement case not found",
    });
  }

  res.json({ success: true, data: updated });
});

export default router;
