import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Validation Schemas
|--------------------------------------------------------------------------
*/

const scheduleInterviewSchema = z.object({
  interviewerId: z.string().uuid("Invalid interviewer ID").optional(),

  dateTime: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      "Interview date must be in the future"
    ),

  type: z.enum(["ONLINE", "ONSITE", "PHONE"]),

  locationOrLink: z
    .string()
    .min(2, "Meeting link or location is required"),

  notes: z.string().max(1000).optional(),
});

const completeInterviewSchema = z.object({
  feedback: z
    .string()
    .min(2, "Interview feedback is required")
    .max(2000),

  notes: z.string().max(1000).optional(),
});

const rescheduleInterviewSchema = z.object({
  dateTime: z.coerce
    .date()
    .refine(
      (date) => date > new Date(),
      "New interview date must be in the future"
    ),

  locationOrLink: z.string().min(2).optional(),

  notes: z.string().max(1000).optional(),
});

/*
|--------------------------------------------------------------------------
| Schedule Interview
|--------------------------------------------------------------------------
| POST /api/applications/:id/interviews
*/

export const scheduleInterview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const applicationId = req.params.id;

    const validation =
      scheduleInterviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid interview details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const application =
      await prisma.application.findUnique({
        where: {
          id: applicationId,
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

    if (!application) {
      return res.status(404).json({
        status: "error",
        message: "Application not found",
      });
    }

    if (
      application.status !== "SCREENING" &&
      application.status !== "INTERVIEW_COMPLETED"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "An interview can only be scheduled after screening or after a completed interview round",
      });
    }

    const activeInterview =
      await prisma.interview.findFirst({
        where: {
          applicationId,
          status: "SCHEDULED",
        },
      });

    if (activeInterview) {
      return res.status(409).json({
        status: "error",
        message:
          "This application already has a scheduled interview",
      });
    }

    const interviewerId =
      validation.data.interviewerId ||
      res.locals.auth.userId;

    const interviewer = await prisma.user.findUnique({
      where: {
        id: interviewerId,
      },
    });

    if (!interviewer) {
      return res.status(404).json({
        status: "error",
        message: "Interviewer not found",
      });
    }

    if (interviewer.status !== "ACTIVE") {
      return res.status(400).json({
        status: "error",
        message: "Interviewer account is inactive",
      });
    }

    const changedBy = res.locals.auth.userId;

    const result = await prisma.$transaction(
      async (tx) => {
        const interview = await tx.interview.create({
          data: {
            applicationId,
            interviewerId,

            dateTime: validation.data.dateTime,
            type: validation.data.type,
            locationOrLink:
              validation.data.locationOrLink,
            notes: validation.data.notes,

            status: "SCHEDULED",
          },

          include: {
            interviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        const oldStatus = application.status;

        await tx.application.update({
          where: {
            id: applicationId,
          },

          data: {
            status: "INTERVIEW_SCHEDULED",
          },
        });

        await tx.statusHistory.create({
          data: {
            applicationId,
            oldStatus,
            newStatus: "INTERVIEW_SCHEDULED",
            changedBy,
            note: "Interview scheduled",
          },
        });

        return interview;
      }
    );

    return res.status(201).json({
      status: "success",
      message: "Interview scheduled successfully",
      interview: result,
    });
  } catch (error) {
    console.error(
      "Schedule interview error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to schedule interview",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Interviews
|--------------------------------------------------------------------------
| GET /api/interviews
|
| Examples:
|
| /api/interviews
| /api/interviews?status=SCHEDULED
| /api/interviews?upcoming=true
|--------------------------------------------------------------------------
*/

export const getInterviews = async (
  req: Request,
  res: Response
) => {
  try {
    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const upcoming =
      req.query.upcoming === "true";

    const validStatuses = [
      "SCHEDULED",
      "COMPLETED",
      "CANCELLED",
      "RESCHEDULED",
    ];

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid interview status",
      });
    }

    const interviews =
      await prisma.interview.findMany({
        where: {
          ...(status
            ? {
                status: status as
                  | "SCHEDULED"
                  | "COMPLETED"
                  | "CANCELLED"
                  | "RESCHEDULED",
              }
            : upcoming
              ? {
                  status: "SCHEDULED",
                }
              : {}),

          ...(upcoming && {
            dateTime: {
              gte: new Date(),
            },
          }),
        },

        include: {
          interviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          application: {
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
          },
        },

        orderBy: {
          dateTime: "asc",
        },
      });

    return res.status(200).json({
      status: "success",
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    console.error(
      "Get interviews error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve interviews",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Complete Interview
|--------------------------------------------------------------------------
| PATCH /api/interviews/:id/complete
|--------------------------------------------------------------------------
*/

export const completeInterview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const validation =
      completeInterviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid interview feedback",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const interview =
      await prisma.interview.findUnique({
        where: {
          id,
        },

        include: {
          application: true,
        },
      });

    if (!interview) {
      return res.status(404).json({
        status: "error",
        message: "Interview not found",
      });
    }

    if (interview.status !== "SCHEDULED") {
      return res.status(400).json({
        status: "error",
        message:
          "Only a scheduled interview can be completed",
      });
    }

    if (
      interview.application.status !==
      "INTERVIEW_SCHEDULED"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Application is not currently awaiting an interview",
      });
    }

    const userId = res.locals.auth.userId;

    const completedInterview =
      await prisma.$transaction(
        async (tx) => {
          const updatedInterview =
            await tx.interview.update({
              where: {
                id,
              },

              data: {
                status: "COMPLETED",
                feedback: validation.data.feedback,

                ...(validation.data.notes && {
                  notes: validation.data.notes,
                }),
              },
            });

          await tx.application.update({
            where: {
              id: interview.applicationId,
            },

            data: {
              status: "INTERVIEW_COMPLETED",
            },
          });

          await tx.statusHistory.create({
            data: {
              applicationId:
                interview.applicationId,

              oldStatus:
                "INTERVIEW_SCHEDULED",

              newStatus:
                "INTERVIEW_COMPLETED",

              changedBy: userId,

              note: "Interview completed",
            },
          });

          return updatedInterview;
        }
      );

    return res.status(200).json({
      status: "success",
      message: "Interview completed successfully",
      interview: completedInterview,
    });
  } catch (error) {
    console.error(
      "Complete interview error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to complete interview",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Cancel Interview
|--------------------------------------------------------------------------
| PATCH /api/interviews/:id/cancel
|--------------------------------------------------------------------------
*/

export const cancelInterview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const interview =
      await prisma.interview.findUnique({
        where: {
          id,
        },

        include: {
          application: true,
        },
      });

    if (!interview) {
      return res.status(404).json({
        status: "error",
        message: "Interview not found",
      });
    }

    if (interview.status !== "SCHEDULED") {
      return res.status(400).json({
        status: "error",
        message:
          "Only a scheduled interview can be cancelled",
      });
    }

    const userId = res.locals.auth.userId;

    const cancelledInterview =
      await prisma.$transaction(
        async (tx) => {
          const updatedInterview =
            await tx.interview.update({
              where: {
                id,
              },

              data: {
                status: "CANCELLED",
              },
            });

          const otherScheduledInterviews =
            await tx.interview.count({
              where: {
                applicationId:
                  interview.applicationId,

                status: "SCHEDULED",

                id: {
                  not: id,
                },
              },
            });

          if (
            otherScheduledInterviews === 0 &&
            interview.application.status ===
              "INTERVIEW_SCHEDULED"
          ) {
            await tx.application.update({
              where: {
                id: interview.applicationId,
              },

              data: {
                status: "SCREENING",
              },
            });

            await tx.statusHistory.create({
              data: {
                applicationId:
                  interview.applicationId,

                oldStatus:
                  "INTERVIEW_SCHEDULED",

                newStatus: "SCREENING",

                changedBy: userId,

                note:
                  "Interview cancelled - application returned to screening",
              },
            });
          }

          return updatedInterview;
        }
      );

    return res.status(200).json({
      status: "success",
      message: "Interview cancelled successfully",
      interview: cancelledInterview,
    });
  } catch (error) {
    console.error(
      "Cancel interview error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to cancel interview",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Reschedule Interview
|--------------------------------------------------------------------------
| PATCH /api/interviews/:id/reschedule
|--------------------------------------------------------------------------
*/

export const rescheduleInterview = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const validation =
      rescheduleInterviewSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid reschedule details",
        errors:
          validation.error.flatten().fieldErrors,
      });
    }

    const interview =
      await prisma.interview.findUnique({
        where: {
          id,
        },
      });

    if (!interview) {
      return res.status(404).json({
        status: "error",
        message: "Interview not found",
      });
    }

    if (interview.status !== "SCHEDULED") {
      return res.status(400).json({
        status: "error",
        message:
          "Only a scheduled interview can be rescheduled",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const previousInterview =
          await tx.interview.update({
            where: {
              id,
            },

            data: {
              status: "RESCHEDULED",
            },
          });

        const newInterview =
          await tx.interview.create({
            data: {
              applicationId:
                interview.applicationId,

              interviewerId:
                interview.interviewerId,

              dateTime:
                validation.data.dateTime,

              type: interview.type,

              locationOrLink:
                validation.data.locationOrLink ??
                interview.locationOrLink,

              notes:
                validation.data.notes ??
                interview.notes,

              status: "SCHEDULED",
            },
          });

        return {
          previousInterview,
          newInterview,
        };
      }
    );

    return res.status(200).json({
      status: "success",
      message:
        "Interview rescheduled successfully",
      ...result,
    });
  } catch (error) {
    console.error(
      "Reschedule interview error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to reschedule interview",
    });
  }
};