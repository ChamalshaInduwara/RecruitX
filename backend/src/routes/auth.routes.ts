import { Router } from "express";
import {
  login,
  getCurrentUser,
} from "../controllers/auth.controller";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);

router.get("/me", authenticate, getCurrentUser);

router.get(
  "/admin-test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Admin access granted",
    });
  }
);

export default router;