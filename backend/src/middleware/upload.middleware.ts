import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
*/

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "documents"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| Storage Configuration
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback
  ) => {
    callback(null, uploadDirectory);
  },

  filename: (
    req,
    file,
    callback
  ) => {
    const extension = path.extname(
      file.originalname
    );

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, uniqueName);
  },
});

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  callback
) => {
  if (
    allowedMimeTypes.includes(file.mimetype)
  ) {
    callback(null, true);
  } else {
    callback(
      new Error(
        "Only PDF, DOC and DOCX files are allowed"
      )
    );
  }
};

/*
|--------------------------------------------------------------------------
| Multer Configuration
|--------------------------------------------------------------------------
*/

export const uploadDocument = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});