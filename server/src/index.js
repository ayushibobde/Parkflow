import "dotenv/config";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import incidentsRouter from "./routes/incidents.js";
import scenariosRouter from "./routes/scenarios.js";
import hotspotsRouter from "./routes/hotspots.js";
import enforcementRouter from "./routes/enforcement.js";
import patrolRoutesRouter from "./routes/patrolRoutes.js";
import reportsRouter from "./routes/reports.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import analyticsRouter from "./routes/analytics.js";

import { loadDataset } from "./services/datasetService.js";
import { initializeDerivedData } from "./services/datasetAnalytics.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ParkFlow API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/incidents", incidentsRouter);
app.use("/api/scenarios", scenariosRouter);
app.use("/api/hotspots", hotspotsRouter);
app.use("/api/enforcement-cases", enforcementRouter);
app.use("/api/patrol-routes", patrolRoutesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/analytics", analyticsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

loadDataset()
  .then(() => {
    initializeDerivedData();
    app.listen(port, () => {
      console.log(
        `ParkFlow API running at http://localhost:${port}`,
      );
    });
  })
  .catch((error) => {
    console.error(
      "Failed to load dataset",
      error,
    );
  });
