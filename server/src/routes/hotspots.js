import { Router } from "express";
import {
  getHotspotByIdFromDataset,
  getHotspotsFromDataset,
} from "../services/datasetAnalytics.js";

const router = Router();

router.get("/", (req, res) => {
  const hotspots = getHotspotsFromDataset(req.query);

  res.json({ success: true, data: hotspots });
});

router.get("/:id", (req, res) => {
  const hotspot = getHotspotByIdFromDataset(req.params.id);

  if (!hotspot) {
    return res.status(404).json({
      success: false,
      message: "Hotspot not found",
    });
  }

  res.json({ success: true, data: hotspot });
});

export default router;
