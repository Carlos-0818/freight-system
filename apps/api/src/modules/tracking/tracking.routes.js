import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { postPackageReceipt } from "./tracking.controller.js";

const router = Router();

router.post(
  "/receipts",
  requireAuth,
  requireRoles("DRIVER", "CLERK", "SUPERVISOR"),
  postPackageReceipt,
);

export default router;
