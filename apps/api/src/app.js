import express from "express";
import { prisma } from "./lib/prisma.js";
import authRouter from "./modules/auth/auth.routes.js";
import stationRouter from "./modules/stations/station.routes.js";
import shipmentRouter from "./modules/shipments/shipment.routes.js";
import packageRouter from "./modules/packages/package.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/stations", stationRouter);
app.use("/api/shipments", shipmentRouter);
app.use("/api/packages", packageRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "freight-api",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "freight-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      service: "freight-api",
      database: "unavailable",
    });
  }
});

export default app;
