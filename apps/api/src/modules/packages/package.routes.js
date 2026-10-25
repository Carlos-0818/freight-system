import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { getPackageByCode } from "./package.controller.js";

const router = Router();

router.get(
  "/by-code",
  requireAuth,
  requireRoles("DRIVER", "LINEHAUL_DRIVER", "CLERK", "SUPERVISOR"),
  getPackageByCode,
);

export default router;
