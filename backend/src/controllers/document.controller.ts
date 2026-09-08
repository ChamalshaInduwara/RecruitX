import {
  Request,
  Response,
} from "express";

import crypto from "crypto";
import path from "path";
import { existsSync } from "fs";

import { z } from "zod";

import prisma from "../config/prisma";

import {
  supabase,
  SUPABASE_STORAGE_BUCKET,
} from "../config/supabase";

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const uploadDocumentSchema =
  z.object({
    type: z.enum([
      "CV",
      "COVER_LETTER",
      "CERTIFICATE",
      "OTHER",
    ]),

    applicationId: z
      .string()
      .uuid()
      .optional(),
  });

/*
|--------------------------------------------------------------------------
| MIME Helper
|--------------------------------------------------------------------------
*/

const getContentType = (
  fileName: string
) => {
  const extension =
    path
      .extname(fileName)
      .toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";

    case ".doc":
      return "application/msword";

    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    default:
      return "application/octet-stream";
  }
};

/*
|--------------------------------------------------------------------------
| Upload Candidate Document
|--------------------------------------------------------------------------
| POST /api/candidates/:id/documents
|--------------------------------------------------------------------------
*/

export const uploadCandidateDocument =
  async (
    req: Request<{
      id: string;
    }>,
    res: Response
  ) => {
    try {
      const candidateId =
        req.params.id;

      /*
      |--------------------------------------------------------------------------
      | File Required
      |--------------------------------------------------------------------------
      */

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message:
            "Document file is required",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Body
      |--------------------------------------------------------------------------
      */

      const validation =
        uploadDocumentSchema.safeParse(
          req.body
        );

      if (!validation.success) {
        return res.status(400).json({
          status: "error",
          message:
            validation.error
              .issues[0]?.message ||
            "Invalid document information",
        });
      }

      const {
        type,
        applicationId,
      } = validation.data;

      /*
      |--------------------------------------------------------------------------
      | Candidate Exists
      |--------------------------------------------------------------------------
      */

      const candidate =
        await prisma.candidate.findUnique({
          where: {
            id: candidateId,
          },
        });

      if (!candidate) {
        return res.status(404).json({
          status: "error",
          message:
            "Candidate not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Related Application
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
          return res.status(404).json({
            status: "error",
            message:
              "Application not found",
          });
        }

        if (
          application.candidateId !==
          candidateId
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "Application does not belong to this candidate",
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Create Storage Path
      |--------------------------------------------------------------------------
      */

      const extension =
        path
          .extname(
            req.file.originalname
          )
          .toLowerCase();

      const storagePath =
        `candidates/${candidateId}/${Date.now()}-${crypto.randomUUID()}${extension}`;

      /*
      |--------------------------------------------------------------------------
      | Upload To Private Supabase Bucket
      |--------------------------------------------------------------------------
      */

      const {
        data: uploadData,
        error: uploadError,
      } =
        await supabase.storage
          .from(
            SUPABASE_STORAGE_BUCKET
          )
          .upload(
            storagePath,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype,

              upsert: false,
            }
          );

      if (
        uploadError ||
        !uploadData
      ) {
        console.error(
          "Supabase upload error:",
          uploadError
        );

        return res.status(500).json({
          status: "error",
          message:
            "Unable to upload document",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Save Metadata In Neon
      |--------------------------------------------------------------------------
      |
      | fileUrl now stores the private Supabase object path.
      |--------------------------------------------------------------------------
      */

      try {
        const document =
          await prisma.document.create({
            data: {
              candidateId,

              applicationId:
                applicationId ||
                null,

              fileName:
                req.file
                  .originalname,

              fileUrl:
                uploadData.path,

              type,
            },
          });

        return res.status(201).json({
          status: "success",
          message:
            "Document uploaded successfully",
          document,
        });
      } catch (databaseError) {
        /*
        |--------------------------------------------------------------------------
        | Remove Supabase File If DB Save Fails
        |--------------------------------------------------------------------------
        */

        await supabase.storage
          .from(
            SUPABASE_STORAGE_BUCKET
          )
          .remove([
            uploadData.path,
          ]);

        throw databaseError;
      }
    } catch (error) {
      console.error(
        "Upload document error:",
        error
      );

      return res.status(500).json({
        status: "error",
        message:
          "Unable to upload document",
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

export const getCandidateDocuments =
  async (
    req: Request<{
      id: string;
    }>,
    res: Response
  ) => {
    try {
      const candidateId =
        req.params.id;

      const candidate =
        await prisma.candidate.findUnique({
          where: {
            id: candidateId,
          },
        });

      if (!candidate) {
        return res.status(404).json({
          status: "error",
          message:
            "Candidate not found",
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

/*
|--------------------------------------------------------------------------
| Protected Document Download
|--------------------------------------------------------------------------
| GET /api/documents/:id/download
|--------------------------------------------------------------------------
*/

export const downloadDocument =
  async (
    req: Request<{
      id: string;
    }>,
    res: Response
  ) => {
    try {
      const document =
        await prisma.document.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!document) {
        return res.status(404).json({
          status: "error",
          message:
            "Document not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Legacy Local File Support
      |--------------------------------------------------------------------------
      |
      | Existing test records may still contain:
      | /uploads/documents/example.pdf
      |--------------------------------------------------------------------------
      */

      if (
        document.fileUrl.startsWith(
          "/uploads/"
        )
      ) {
        const fileName =
          path.basename(
            document.fileUrl
          );

        const localPath =
          path.join(
            process.cwd(),
            "uploads",
            "documents",
            fileName
          );

        if (
          !existsSync(localPath)
        ) {
          return res.status(404).json({
            status: "error",
            message:
              "Document file not found",
          });
        }

        res.setHeader(
          "Content-Type",
          getContentType(
            document.fileName
          )
        );

        res.setHeader(
          "Content-Disposition",
          `inline; filename="${document.fileName.replace(
            /["\r\n]/g,
            ""
          )}"`
        );

        return res.sendFile(
          localPath
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Download Private File From Supabase
      |--------------------------------------------------------------------------
      */

      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            SUPABASE_STORAGE_BUCKET
          )
          .download(
            document.fileUrl
          );

      if (
        error ||
        !data
      ) {
        console.error(
          "Supabase download error:",
          error
        );

        return res.status(404).json({
          status: "error",
          message:
            "Document file not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Convert Blob → Node Buffer
      |--------------------------------------------------------------------------
      */

      const arrayBuffer =
        await data.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );

      const safeFileName =
        document.fileName.replace(
          /["\r\n]/g,
          ""
        );

      res.setHeader(
        "Content-Type",
        getContentType(
          document.fileName
        )
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${safeFileName}"`
      );

      return res.send(buffer);
    } catch (error) {
      console.error(
        "Download document error:",
        error
      );

      return res.status(500).json({
        status: "error",
        message:
          "Unable to retrieve document",
      });
    }
  };