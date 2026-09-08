import { Router } from "express";
import {
  login,
  getCurrentUser,
} from "../controllers/auth.controller";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";
import {
  loginRateLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/login",
  loginRateLimiter,
  login
);

router.get("/me", authenticate, getCurrentUser);

export default router;