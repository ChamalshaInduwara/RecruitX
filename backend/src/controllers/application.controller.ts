import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const createApplicationSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  vacancyId: z.string().uuid("Invalid vacancy ID"),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "APPLIED",
    "SCREENING",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "SELECTED",
    "REJECTED",
  ]),

  note: z.string().max(500).optional(),
});

/*
|--------------------------------------------------------------------------
| Allowed Recruitment Pipeline
|--------------------------------------------------------------------------
*/

const allowedTransitions: Record<string, string[]> = {
  APPLIED: ["SCREENING", "REJECTED"],

  SCREENING: ["INTERVIEW_SCHEDULED", "REJECTED"],

  INTERVIEW_SCHEDULED: ["INTERVIEW_COMPLETED", "REJECTED"],

  INTERVIEW_COMPLETED: ["INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"],

  SELECTED: [],
  REJECTED: [],
};

/*
|--------------------------------------------------------------------------
| Create Application
|--------------------------------------------------------------------------
| POST /api/applications
*/

export const createApplication = async (req: Request, res: Response) => {
  try {
    const validation = createApplicationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid application details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { candidateId, vacancyId } = validation.data;

    const candidate = await prisma.candidate.findUnique({
      where: {
        id: candidateId,
      },
    });

    if (!candidate) {
      return res.status(404).json({
        status: "error",
        message: "Candidate not found",
      });
    }

    const vacancy = await prisma.vacancy.findUnique({
      where: {
        id: vacancyId,
      },
    });

    if (!vacancy) {
      return res.status(404).json({
        status: "error",
        message: "Vacancy not found",
      });
    }

    if (vacancy.status !== "ACTIVE") {
      return res.status(400).json({
        status: "error",
        message: "Applications can only be created for active vacancies",
      });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId,
        vacancyId,
      },
    });

    if (existingApplication) {
      return res.status(409).json({
        status: "error",
        message: "This candidate already has an application for this vacancy",
      });
    }

    const userId = res.locals.auth.userId;

    const application = await prisma.$transaction(async (tx) => {
      const newApplication = await tx.application.create({
        data: {
          candidateId,
          vacancyId,
          status: "APPLIED",
        },

        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          vacancy: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
        },
      });

      await tx.statusHistory.create({
        data: {
          applicationId: newApplication.id,
          oldStatus: null,
          newStatus: "APPLIED",
          changedBy: userId,
          note: "Application created",
        },
      });

      return newApplication;
    });

    return res.status(201).json({
      status: "success",
      message: "Application created successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to create application",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Applications
|--------------------------------------------------------------------------
| GET /api/applications
|
| Examples:
| /api/applications
| /api/applications?status=SCREENING
| /api/applications?vacancyId=...
*/

export const getApplications = async (req: Request, res: Response) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const vacancyId =
      typeof req.query.vacancyId === "string" ? req.query.vacancyId : undefined;

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const validStatuses = [
      "APPLIED",
      "SCREENING",
      "INTERVIEW_SCHEDULED",
      "INTERVIEW_COMPLETED",
      "SELECTED",
      "REJECTED",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid application status",
      });
    }

    const applications = await prisma.application.findMany({
      where: {
        ...(status && {
          status: status as
            | "APPLIED"
            | "SCREENING"
            | "INTERVIEW_SCHEDULED"
            | "INTERVIEW_COMPLETED"
            | "SELECTED"
            | "REJECTED",
        }),

        ...(vacancyId && {
          vacancyId,
        }),

        ...(search && {
          OR: [
            {
              candidate: {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },

            {
              candidate: {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },

            {
              vacancy: {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      },

      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            skills: true,
          },
        },

        vacancy: {
          select: {
            id: true,
            title: true,
            department: true,
            status: true,
          },
        },

        cvAnalysis: {
          select: {
            overallScore: true,
            recommendation: true,
            analyzedAt: true,
          },
        },

        _count: {
          select: {
            interviews: true,
            statusHistory: true,
          },
        },
      },

      orderBy: {
        appliedAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve applications",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Application By ID
|--------------------------------------------------------------------------
| GET /api/applications/:id
*/

export const getApplicationById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: {
        id,
      },

      include: {
        candidate: {
          include: {
            documents: true,
          },
        },

        vacancy: true,

        cvAnalysis: true,

        interviews: {
          include: {
            interviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            dateTime: "desc",
          },
        },

        statusHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            changedAt: "desc",
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({
        status: "error",
        message: "Application not found",
      });
    }

    return res.status(200).json({
      status: "success",
      application,
    });
  } catch (error) {
    console.error("Get application error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve application",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Application Status
|--------------------------------------------------------------------------
| PATCH /api/applications/:id/status
*/

export const updateApplicationStatus = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const validation = updateStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { status, note } = validation.data;

    const existingApplication = await prisma.application.findUnique({
      where: {
        id,
      },
    });

    if (!existingApplication) {
      return res.status(404).json({
        status: "error",
        message: "Application not found",
      });
    }

    if (existingApplication.status === status) {
      return res.status(400).json({
        status: "error",
        message: "Application is already in this status",
      });
    }

    const validNextStatuses =
      allowedTransitions[existingApplication.status] || [];

    if (!validNextStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Cannot move application from ${existingApplication.status} to ${status}`,
        allowedStatuses: validNextStatuses,
      });
    }

    const userId = res.locals.auth.userId;

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: {
          id,
        },

        data: {
          status,
        },

        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          vacancy: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      await tx.statusHistory.create({
        data: {
          applicationId: id,
          oldStatus: existingApplication.status,
          newStatus: status,
          changedBy: userId,
          note,
        },
      });

      return application;
    });

    return res.status(200).json({
      status: "success",
      message: "Application status updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application status error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to update application status",
    });
  }
};
