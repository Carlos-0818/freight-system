import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { getStations } from "./station.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRoles("DRIVER", "LINEHAUL_DRIVER", "CLERK", "SUPERVISOR"),
  getStations,
);

export default router;
