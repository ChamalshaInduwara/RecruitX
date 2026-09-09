import {
  Request,
  Response,
} from "express";

import prisma from "../config/prisma";

import {
  analyzeApplicationCv,
} from "../services/cvAnalysis.service";

/*
|--------------------------------------------------------------------------
| Analyze Candidate CV
|--------------------------------------------------------------------------
| POST /api/applications/:id/analyze-cv
|--------------------------------------------------------------------------
*/

export const analyzeCv =
  async (
    req: Request<{
      id: string;
    }>,
    res: Response
  ) => {
    try {
      const applicationId =
        req.params.id;

      /*
      |--------------------------------------------------------------------------
      | Check Application
      |--------------------------------------------------------------------------
      */

      const application =
        await prisma.application.findUnique({
          where: {
            id: applicationId,
          },

          select: {
            id: true,
            candidateId: true,
            vacancyId: true,
          },
        });

      if (!application) {
        return res.status(404).json({
          status: "error",
          message:
            "Application not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Run CV Analysis
      |--------------------------------------------------------------------------
      */

      const result =
        await analyzeApplicationCv(
          applicationId
        );

      return res.status(200).json({
        status: "success",

        message:
          "CV analysis completed successfully",

        analysis:
          result.analysis,

        details:
          result.details,

        notice:
          "This analysis is decision-support only. Final recruitment decisions must be made by an authorized recruiter.",
      });
    } catch (error) {
      console.error(
        "Analyze CV error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Known CV Errors
      |--------------------------------------------------------------------------
      */

      if (
        error instanceof Error
      ) {
        if (
          error.message ===
          "No CV found for this candidate"
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "No CV has been uploaded for this candidate",
          });
        }

        if (
          error.message ===
          "No readable text found in CV"
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "The CV does not contain readable text",
          });
        }

        if (
          error.message ===
          "Unsupported CV file format"
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "Unsupported CV file format",
          });
        }
      }

      return res.status(500).json({
        status: "error",
        message:
          "Unable to analyze CV",
      });
    }
  };