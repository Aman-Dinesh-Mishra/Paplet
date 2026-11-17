import { Router } from "express";
import { pdfUpload } from "../middleware/upload.js";
import { uploadDocumentController } from "../controllers/documents.controller.js";

const router = Router();

router.post("/", pdfUpload.single("file"), uploadDocumentController);

export default router;
