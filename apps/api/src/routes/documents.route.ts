import { Router } from "express";
import { pdfUpload } from "../middleware/upload.js";
import { validatePdf } from "../middleware/validate-pdf.middleware.js";
import { uploadDocumentController } from "../controllers/documents.controller.js";

const router = Router();

router.post(
  "/",
  pdfUpload.single("file"),
  validatePdf,
  uploadDocumentController,
);

export default router;
