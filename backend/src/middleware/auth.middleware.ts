import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import prisma from "../config/prisma";

interface TokenPayload {
  userId: string;
  role?: string;
}

/*
|--------------------------------------------------------------------------
| Authenticate
|--------------------------------------------------------------------------
*/

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Authentication required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }

    const decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as TokenPayload;

    /*
    |--------------------------------------------------------------------------
    | Check Current User In Database
    |--------------------------------------------------------------------------
    */

    const user =
      await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },

        select: {
          id: true,
          role: true,
          status: true,
        },
      });

    if (
      !user ||
      user.status !== "ACTIVE"
    ) {
      return res.status(401).json({
        status: "error",
        message:
          "Account is inactive or unavailable",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Use Current Database Role
    |--------------------------------------------------------------------------
    */

    res.locals.auth = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch {
    return res.status(401).json({
      status: "error",
      message:
        "Invalid or expired token",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Role Authorization
|--------------------------------------------------------------------------
*/

export const authorizeRoles = (
  ...allowedRoles: string[]
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const role =
      res.locals.auth?.role;

    if (!role) {
      return res.status(401).json({
        status: "error",
        message:
          "Authentication required",
      });
    }

    if (
      !allowedRoles.includes(role)
    ) {
      return res.status(403).json({
        status: "error",
        message:
          "You do not have permission to perform this action",
      });
    }

    next();
  };
};