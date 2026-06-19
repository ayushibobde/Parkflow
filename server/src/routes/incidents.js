import { Router } from "express";
import { readJson } from "../services/jsonStore.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const incidents = await readJson("incidents.json");
    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const incidents = await readJson("incidents.json");
    const incident = incidents.find((item) => item.id === req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
});

export default router;
