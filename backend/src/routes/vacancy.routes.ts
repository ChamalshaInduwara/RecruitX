import { Router } from "express";

import {
  createVacancy,
  getVacancies,
  getVacancyById,
  updateVacancy,
} from "../controllers/vacancy.controller";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getVacancies,
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  createVacancy,
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  getVacancyById,
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "RECRUITER"),
  updateVacancy,
);

export default router;
