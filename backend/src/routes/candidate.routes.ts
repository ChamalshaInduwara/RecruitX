import { Router } from "express";

import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
} from "../controllers/candidate.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getCandidates
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  createCandidate
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getCandidateById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  updateCandidate
);

export default router;