import { Router } from "express";

import {
  downloadDocument,
} from "../controllers/document.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/:id/download",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "RECRUITER"
  ),
  downloadDocument
);

export default router;