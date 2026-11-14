import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import multer from "multer";
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const uploadDirectory = resolve(currentDirectory, "../../uploads");

mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, _file, callback) => {
    callback(null, `${randomUUID()}.pdf`);
  },
});
const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype !== "application/pdf") {
    callback(new Error("Only PDF Files are allowed"));
    return;
  }
  callback(null, true);
};
export const pdfUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});
