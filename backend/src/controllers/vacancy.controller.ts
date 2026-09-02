import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

const createVacancySchema = z.object({
  title: z.string().min(2, "Title is required"),
  department: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  requiredSkills: z.string().optional(),
  employmentType: z.string().optional(),
  deadline: z.coerce.date().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

const updateVacancySchema = z.object({
  title: z.string().min(2, "Title is required").optional(),
  department: z.string().optional(),
  description: z.string().min(10, "Description is required").optional(),
  requiredSkills: z.string().optional(),
  employmentType: z.string().optional(),
  deadline: z.coerce.date().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

export const createVacancy = async (req: Request, res: Response) => {
  try {
    const validation = createVacancySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vacancy details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const userId = res.locals.auth.userId;

    const vacancy = await prisma.vacancy.create({
      data: {
        ...validation.data,
        createdBy: userId,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Vacancy created successfully",
      vacancy,
    });
  } catch (error) {
    console.error("Create vacancy error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to create vacancy",
    });
  }
};

export const getVacancies = async (req: Request, res: Response) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const validStatuses = ["DRAFT", "ACTIVE", "CLOSED"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vacancy status",
      });
    }

    const vacancies = await prisma.vacancy.findMany({
      where: {
        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),

        ...(status && {
          status: status as "DRAFT" | "ACTIVE" | "CLOSED",
        }),
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            applications: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      count: vacancies.length,
      vacancies,
    });
  } catch (error) {
    console.error("Get vacancies error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve vacancies",
    });
  }
};

export const getVacancyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vacancy = await prisma.vacancy.findUnique({
      where: {
        id: Array.isArray(id) ? id[0] : id,
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,

            candidate: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },

        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!vacancy) {
      return res.status(404).json({
        status: "error",
        message: "Vacancy not found",
      });
    }

    return res.status(200).json({
      status: "success",
      vacancy,
    });
  } catch (error) {
    console.error("Get vacancy error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve vacancy",
    });
  }
};

export const updateVacancy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const validation = updateVacancySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vacancy details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const vacancyId = Array.isArray(id) ? id[0] : id;

    const existingVacancy = await prisma.vacancy.findUnique({
      where: {
        id: vacancyId,
      },
    });

    if (!existingVacancy) {
      return res.status(404).json({
        status: "error",
        message: "Vacancy not found",
      });
    }

    const vacancy = await prisma.vacancy.update({
      where: {
        id: vacancyId,
      },

      data: validation.data,
    });

    return res.status(200).json({
      status: "success",
      message: "Vacancy updated successfully",
      vacancy,
    });
  } catch (error) {
    console.error("Update vacancy error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to update vacancy",
    });
  }
};
