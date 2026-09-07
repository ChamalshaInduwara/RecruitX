import { Router } from "express";

import {
  createUser,
  getUsers,
  updateUser,
} from "../controllers/user.controller";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| Everything Here Is ADMIN Only
|--------------------------------------------------------------------------
*/

router.use(
  authenticate,
  authorizeRoles("ADMIN")
);

router.get(
  "/",
  getUsers
);

router.post(
  "/",
  createUser
);

router.patch(
  "/:id",
  updateUser
);

export default router;