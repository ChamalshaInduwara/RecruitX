import { Router } from "express";

import {
  getInterviews,
  completeInterview,
  cancelInterview,
  rescheduleInterview,
} from "../controllers/interview.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getInterviews
);

router.patch(
  "/:id/complete",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  completeInterview
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  cancelInterview
);

router.patch(
  "/:id/reschedule",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  rescheduleInterview
);

export default router;