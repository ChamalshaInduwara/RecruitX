import {
  Request,
  Response,
} from "express";

import bcrypt from "bcrypt";

import { z } from "zod";

import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Name must contain at least 2 characters"
    ),

  email: z
    .string()
    .trim()
    .email(
      "A valid email address is required"
    ),

  password: z
    .string()
    .min(
      8,
      "Password must contain at least 8 characters"
    ),

  role: z
    .enum([
      "ADMIN",
      "RECRUITER",
    ])
    .default("RECRUITER"),
});

const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .optional(),

    role: z
      .enum([
        "ADMIN",
        "RECRUITER",
      ])
      .optional(),

    status: z
      .enum([
        "ACTIVE",
        "INACTIVE",
      ])
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one field is required",
    }
  );

/*
|--------------------------------------------------------------------------
| Get Users
|--------------------------------------------------------------------------
| GET /api/users
|--------------------------------------------------------------------------
*/

export const getUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const users =
      await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              createdVacancies: true,
              interviews: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Unable to retrieve users",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
| POST /api/users
|--------------------------------------------------------------------------
*/

export const createUser = async (
  req: Request,
  res: Response
) => {
  try {
    const validation =
      createUserSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message:
          validation.error.issues[0]
            ?.message ||
          "Invalid user information",
      });
    }

    const {
      name,
      email,
      password,
      role,
    } = validation.data;

    /*
    |--------------------------------------------------------------------------
    | Duplicate Email
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          "A user with this email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /*
    |--------------------------------------------------------------------------
    | Create User
    |--------------------------------------------------------------------------
    */

    const user =
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          status: "ACTIVE",
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return res.status(201).json({
      status: "success",
      message:
        "User created successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Unable to create user",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
| PATCH /api/users/:id
|--------------------------------------------------------------------------
*/

export const updateUser = async (
  req: Request<{
    id: string;
  }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const currentUserId =
      res.locals.auth?.userId;

    const validation =
      updateUserSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message:
          validation.error.issues[0]
            ?.message ||
          "Invalid user information",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check User Exists
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Admin From Locking Themselves Out
    |--------------------------------------------------------------------------
    */

    if (
      id === currentUserId &&
      validation.data.status ===
        "INACTIVE"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "You cannot deactivate your own account",
      });
    }

    if (
      id === currentUserId &&
      validation.data.role &&
      validation.data.role !==
        "ADMIN"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "You cannot remove your own administrator role",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const user =
      await prisma.user.update({
        where: {
          id,
        },

        data:
          validation.data,

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return res.status(200).json({
      status: "success",
      message:
        "User updated successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Unable to update user",
    });
  }
};