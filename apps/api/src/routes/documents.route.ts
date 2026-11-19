import { Router } from "express";
import { pdfUpload } from "../middleware/upload.js";
import { validatePdf } from "../middleware/validate-pdf.middleware.js";
import {
  uploadDocumentController,
  listDocumentsController,
} from "../controllers/documents.controller.js";
import { uploadLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.get("/", listDocumentsController);

router.post(
  "/",
  uploadLimiter,
  pdfUpload.single("file"),
  validatePdf,
  uploadDocumentController,
);

export default router;
