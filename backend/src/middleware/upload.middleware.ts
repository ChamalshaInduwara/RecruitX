import multer from "multer";

/*
|--------------------------------------------------------------------------
| Allowed Document Types
|--------------------------------------------------------------------------
*/

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/*
|--------------------------------------------------------------------------
| Memory Storage
|--------------------------------------------------------------------------
|
| Files stay temporarily in memory.
| They are then uploaded directly to Supabase Storage.
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| Upload Middleware
|--------------------------------------------------------------------------
*/

export const uploadDocument = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    if (
      allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Only PDF, DOC and DOCX files are allowed"
        )
      );
    }
  },
});