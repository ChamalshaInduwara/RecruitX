import {
  NextFunction,
  Request,
  Response,
} from "express";

import multer from "multer";

/*
|--------------------------------------------------------------------------
| Not Found Handler
|--------------------------------------------------------------------------
*/

export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  return res.status(404).json({
    status: "error",
    message: "Route not found",
  });
};

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(
    "Unhandled error:",
    error
  );

  /*
  |--------------------------------------------------------------------------
  | Multer Errors
  |--------------------------------------------------------------------------
  */

  if (
    error instanceof
    multer.MulterError
  ) {
    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "File must be 5 MB or smaller",
      });
    }

    return res.status(400).json({
      status: "error",
      message:
        "Unable to upload file",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Normal Errors
  |--------------------------------------------------------------------------
  */

  if (error instanceof Error) {
    if (
      error.message.includes(
        "Only PDF"
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }

  return res.status(500).json({
    status: "error",
    message:
      "Internal server error",
  });
};