import express from "express";
import { prisma } from "./lib/prisma.js";
import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);

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
