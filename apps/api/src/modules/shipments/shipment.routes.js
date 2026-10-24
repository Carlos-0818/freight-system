import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { postShipment } from "./shipment.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRoles("DRIVER", "CLERK", "SUPERVISOR"),
  postShipment,
);

export default router;
