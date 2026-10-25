import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";

import {
  postShipment,
  getShipmentByPaperNumber,
} from "./shipment.controller.js";

const router = Router();

router.get(
  "/by-paper-number",
  requireAuth,
  requireRoles("DRIVER", "LINEHAUL_DRIVER", "CLERK", "SUPERVISOR"),
  getShipmentByPaperNumber,
);

router.post(
  "/",
  requireAuth,
  requireRoles("DRIVER", "CLERK", "SUPERVISOR"),
  postShipment,
);

export default router;
