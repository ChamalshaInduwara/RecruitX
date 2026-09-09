import path from "path";
import { readFile } from "fs/promises";

import { PDFParse } from "pdf-parse";
import WordExtractor = require("word-extractor");

import prisma from "../config/prisma";

import {
  supabase,
  SUPABASE_STORAGE_BUCKET,
} from "../config/supabase";

const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

export interface ExtractedCvText {
  documentId: string;
  fileName: string;
  text: string;
  characterCount: number;
  wordCount: number;
}

/*
|--------------------------------------------------------------------------
| Clean Extracted Text
|--------------------------------------------------------------------------
*/

const cleanExtractedText = (
  text: string
): string => {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/*
|--------------------------------------------------------------------------
| Download CV
|--------------------------------------------------------------------------
|
| Supports:
| 1. New Supabase documents
| 2. Old local development documents
|--------------------------------------------------------------------------
*/

const downloadDocumentBuffer =
  async (
    fileUrl: string
  ): Promise<Buffer> => {
    /*
    |--------------------------------------------------------------------------
    | Legacy Local File
    |--------------------------------------------------------------------------
    */

    if (
      fileUrl.startsWith("/uploads/")
    ) {
      const fileName =
        path.basename(fileUrl);

      const localPath =
        path.join(
          process.cwd(),
          "uploads",
          "documents",
          fileName
        );

      return await readFile(
        localPath
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Supabase Private Storage
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
        .download(fileUrl);

    if (
      error ||
      !data
    ) {
      console.error(
        "Supabase CV download error:",
        error
      );

      throw new Error(
        "Unable to download CV"
      );
    }

    const arrayBuffer =
      await data.arrayBuffer();

    return Buffer.from(
      arrayBuffer
    );
  };

/*
|--------------------------------------------------------------------------
| PDF Extraction
|--------------------------------------------------------------------------
*/

const extractPdfText =
  async (
    buffer: Buffer
  ): Promise<string> => {
    const parser =
      new PDFParse({
        data: buffer,
      });

    try {
      const result =
        await parser.getText();

      return result.text;
    } finally {
      await parser.destroy();
    }
  };

/*
|--------------------------------------------------------------------------
| Word Extraction
|--------------------------------------------------------------------------
|
| Supports .doc and .docx
|--------------------------------------------------------------------------
*/

const extractWordText =
  async (
    buffer: Buffer
  ): Promise<string> => {
    const extractor =
      new WordExtractor();

    const document =
      await extractor.extract(
        buffer
      );

    return document.getBody();
  };

/*
|--------------------------------------------------------------------------
| Choose Parser
|--------------------------------------------------------------------------
*/

const extractTextFromBuffer =
  async (
    buffer: Buffer,
    fileName: string
  ): Promise<string> => {
    const extension =
      path
        .extname(fileName)
        .toLowerCase();

    switch (extension) {
      case ".pdf":
        return await extractPdfText(
          buffer
        );

      case ".doc":
      case ".docx":
        return await extractWordText(
          buffer
        );

      default:
        throw new Error(
          "Unsupported CV file format"
        );
    }
  };

/*
|--------------------------------------------------------------------------
| Find Candidate CV
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. CV specifically attached to the application
| 2. Candidate's latest general CV
|--------------------------------------------------------------------------
*/

const findCvForApplication =
  async (
    applicationId: string
  ) => {
    const application =
      await prisma.application.findUnique({
        where: {
          id: applicationId,
        },

        select: {
          id: true,
          candidateId: true,
        },
      });

    if (!application) {
      throw new Error(
        "Application not found"
      );
    }

    let cv =
      await prisma.document.findFirst({
        where: {
          candidateId:
            application.candidateId,

          applicationId:
            application.id,

          type: "CV",
        },

        orderBy: {
          uploadedAt: "desc",
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Fall Back To General Candidate CV
    |--------------------------------------------------------------------------
    */

    if (!cv) {
      cv =
        await prisma.document.findFirst({
          where: {
            candidateId:
              application.candidateId,

            applicationId: null,

            type: "CV",
          },

          orderBy: {
            uploadedAt: "desc",
          },
        });
    }

    if (!cv) {
      throw new Error(
        "No CV found for this candidate"
      );
    }

    return cv;
  };

/*
|--------------------------------------------------------------------------
| Extract CV Text For Application
|--------------------------------------------------------------------------
*/

export const extractCvTextForApplication =
  async (
    applicationId: string
  ): Promise<ExtractedCvText> => {
    /*
    |--------------------------------------------------------------------------
    | Find CV
    |--------------------------------------------------------------------------
    */

    const cv =
      await findCvForApplication(
        applicationId
      );

    /*
    |--------------------------------------------------------------------------
    | Download File
    |--------------------------------------------------------------------------
    */

    const buffer =
      await downloadDocumentBuffer(
        cv.fileUrl
      );

    /*
    |--------------------------------------------------------------------------
    | Extract Text
    |--------------------------------------------------------------------------
    */

    const rawText =
      await extractTextFromBuffer(
        buffer,
        cv.fileName
      );

    const cleanedText =
      cleanExtractedText(
        rawText
      );

    if (!cleanedText) {
      throw new Error(
        "No readable text found in CV"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Limit Text Size
    |--------------------------------------------------------------------------
    */

    const text =
      cleanedText.slice(
        0,
        MAX_EXTRACTED_TEXT_LENGTH
      );

    const wordCount =
      text
        .split(/\s+/)
        .filter(Boolean)
        .length;

    return {
      documentId: cv.id,
      fileName: cv.fileName,
      text,
      characterCount:
        text.length,
      wordCount,
    };
  };