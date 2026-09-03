import { Request, Response } from "express";
import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Get Dashboard Summary
|--------------------------------------------------------------------------
| GET /api/dashboard/summary
|--------------------------------------------------------------------------
*/

export const getDashboardSummary = async (
  req: Request,
  res: Response
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Run Dashboard Queries
    |--------------------------------------------------------------------------
    */

    const [
      activeVacancies,
      totalApplications,
      applicationStatusGroups,
      upcomingInterviews,
    ] = await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Active Vacancies
      |--------------------------------------------------------------------------
      */

      prisma.vacancy.count({
        where: {
          status: "ACTIVE",
        },
      }),

      /*
      |--------------------------------------------------------------------------
      | Total Applications
      |--------------------------------------------------------------------------
      */

      prisma.application.count(),

      /*
      |--------------------------------------------------------------------------
      | Applications Grouped By Status
      |--------------------------------------------------------------------------
      */

      prisma.application.groupBy({
        by: ["status"],

        _count: {
          _all: true,
        },
      }),

      /*
      |--------------------------------------------------------------------------
      | Upcoming Interviews
      |--------------------------------------------------------------------------
      */

      prisma.interview.findMany({
        where: {
          status: "SCHEDULED",

          dateTime: {
            gte: new Date(),
          },
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

        take: 5,
      }),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Default Application Status Counts
    |--------------------------------------------------------------------------
    */

    const applicationsByStatus = {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW_SCHEDULED: 0,
      INTERVIEW_COMPLETED: 0,
      SELECTED: 0,
      REJECTED: 0,
    };

    /*
    |--------------------------------------------------------------------------
    | Fill Counts From Database
    |--------------------------------------------------------------------------
    */

    applicationStatusGroups.forEach((group) => {
      applicationsByStatus[group.status] =
        group._count._all;
    });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      status: "success",

      summary: {
        activeVacancies,
        totalApplications,

        applicationsByStatus,

        selectedCandidates:
          applicationsByStatus.SELECTED,

        rejectedCandidates:
          applicationsByStatus.REJECTED,

        upcomingInterviews:
          upcomingInterviews.length,
      },

      upcomingInterviews,
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Unable to retrieve dashboard summary",
    });
  }
};