import { Router } from "express";

import {
  getDashboardSummary,
} from "../controllers/dashboard.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getDashboardSummary
);

export default router;