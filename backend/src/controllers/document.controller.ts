import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs";
import prisma from "../config/prisma";

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const documentSchema = z.object({
  type: z.enum([
    "CV",
    "COVER_LETTER",
    "CERTIFICATE",
    "OTHER",
  ]),

  applicationId: z
    .string()
    .uuid("Invalid application ID")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| Upload Candidate Document
|--------------------------------------------------------------------------
| POST /api/candidates/:id/documents
|--------------------------------------------------------------------------
*/

export const uploadCandidateDocument = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const candidateId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Please select a document",
      });
    }

    const validation =
      documentSchema.safeParse(req.body);

    if (!validation.success) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        status: "error",
        message: "Invalid document details",
        errors:
          validation.error.flatten().fieldErrors,
      });
    }

    const candidate =
      await prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
      });

    if (!candidate) {
      fs.unlink(req.file.path, () => {});

      return res.status(404).json({
        status: "error",
        message: "Candidate not found",
      });
    }

    const { type, applicationId } =
      validation.data;

    /*
    |--------------------------------------------------------------------------
    | Check Application
    |--------------------------------------------------------------------------
    */

    if (applicationId) {
      const application =
        await prisma.application.findUnique({
          where: {
            id: applicationId,
          },
        });

      if (!application) {
        fs.unlink(req.file.path, () => {});

        return res.status(404).json({
          status: "error",
          message: "Application not found",
        });
      }

      if (
        application.candidateId !==
        candidateId
      ) {
        fs.unlink(req.file.path, () => {});

        return res.status(400).json({
          status: "error",
          message:
            "This application does not belong to the candidate",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Store Document Metadata
    |--------------------------------------------------------------------------
    */

    const fileUrl =
      `/uploads/documents/${req.file.filename}`;

    const document =
      await prisma.document.create({
        data: {
          candidateId,
          applicationId,
          fileName: req.file.originalname,
          fileUrl,
          type,
        },
      });

    return res.status(201).json({
      status: "success",
      message:
        "Document uploaded successfully",
      document,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    console.error(
      "Upload document error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Unable to upload document",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Candidate Documents
|--------------------------------------------------------------------------
| GET /api/candidates/:id/documents
|--------------------------------------------------------------------------
*/

export const getCandidateDocuments = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const candidateId = req.params.id;

    const candidate =
      await prisma.candidate.findUnique({
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

    const documents =
      await prisma.document.findMany({
        where: {
          candidateId,
        },

        orderBy: {
          uploadedAt: "desc",
        },
      });

    return res.status(200).json({
      status: "success",
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error(
      "Get documents error:",
      error
    );

    return res.status(500).json({
      status: "error",
      message:
        "Unable to retrieve documents",
    });
  }
};