import { Router } from "express";

import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
} from "../controllers/application.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

import {
  scheduleInterview,
} from "../controllers/interview.controller";

import {
  analyzeCv,
} from "../controllers/cvAnalysis.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getApplications
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  createApplication
);

router.post(
  "/:id/interviews",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  scheduleInterview
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getApplicationById
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  updateApplicationStatus
);

router.post(
  "/:id/analyze-cv",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "RECRUITER"
  ),
  analyzeCv
);

export default router;