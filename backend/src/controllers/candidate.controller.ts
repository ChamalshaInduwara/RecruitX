import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

const createCandidateSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),

  email: z
    .string()
    .email("Please enter a valid email address"),

  phone: z.string().optional(),

  location: z.string().optional(),

  education: z.string().optional(),

  experience: z.string().optional(),

  skills: z.string().optional(),
});

const updateCandidateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is required")
    .optional(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .optional(),

  phone: z.string().optional(),

  location: z.string().optional(),

  education: z.string().optional(),

  experience: z.string().optional(),

  skills: z.string().optional(),
});

/*
|--------------------------------------------------------------------------
| Create Candidate
|--------------------------------------------------------------------------
| POST /api/candidates
*/

export const createCandidate = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createCandidateSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid candidate details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const existingCandidate =
      await prisma.candidate.findUnique({
        where: {
          email: validation.data.email,
        },
      });

    if (existingCandidate) {
      return res.status(409).json({
        status: "error",
        message:
          "A candidate with this email already exists",
      });
    }

    const candidate = await prisma.candidate.create({
      data: validation.data,
    });

    return res.status(201).json({
      status: "success",
      message: "Candidate created successfully",
      candidate,
    });
  } catch (error) {
    console.error("Create candidate error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to create candidate",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Candidates
|--------------------------------------------------------------------------
| GET /api/candidates
|
| Examples:
| /api/candidates
| /api/candidates?search=Kasun
| /api/candidates?search=React
*/

export const getCandidates = async (
  req: Request,
  res: Response
) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const candidates =
      await prisma.candidate.findMany({
        where: search
          ? {
              OR: [
                {
                  fullName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                {
                  skills: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : undefined,

        include: {
          _count: {
            select: {
              applications: true,
              documents: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      status: "success",
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Get candidates error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve candidates",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Candidate By ID
|--------------------------------------------------------------------------
| GET /api/candidates/:id
*/

export const getCandidateById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const candidate =
      await prisma.candidate.findUnique({
        where: {
          id,
        },

        include: {
          applications: {
            include: {
              vacancy: {
                select: {
                  id: true,
                  title: true,
                  department: true,
                  status: true,
                },
              },

              interviews: true,
            },

            orderBy: {
              appliedAt: "desc",
            },
          },

          documents: true,
        },
      });

    if (!candidate) {
      return res.status(404).json({
        status: "error",
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      status: "success",
      candidate,
    });
  } catch (error) {
    console.error("Get candidate error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve candidate",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Candidate
|--------------------------------------------------------------------------
| PUT /api/candidates/:id
*/

export const updateCandidate = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const validation = updateCandidateSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid candidate details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const existingCandidate =
      await prisma.candidate.findUnique({
        where: {
          id,
        },
      });

    if (!existingCandidate) {
      return res.status(404).json({
        status: "error",
        message: "Candidate not found",
      });
    }

    if (
      validation.data.email &&
      validation.data.email !== existingCandidate.email
    ) {
      const emailExists =
        await prisma.candidate.findUnique({
          where: {
            email: validation.data.email,
          },
        });

      if (emailExists) {
        return res.status(409).json({
          status: "error",
          message:
            "A candidate with this email already exists",
        });
      }
    }

    const candidate = await prisma.candidate.update({
      where: {
        id,
      },

      data: validation.data,
    });

    return res.status(200).json({
      status: "success",
      message: "Candidate updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to update candidate",
    });
  }
};