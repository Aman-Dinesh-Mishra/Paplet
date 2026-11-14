import { Router } from "express";
import { open, unlink } from "node:fs/promises";
import { pdfUpload } from "../middleware/upload.js";
import { extractPdfText } from "../services/pdf.service.js";
import { createChunks } from "../services/chunk.service.js";
import { pool } from "../db/pool.js";
import {
  insertDocument,
  insertChunks,
  updateChunkEmbeddings,
} from "../services/document.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";
const router = Router();

router.post("/", pdfUpload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "A PDF file is required" });
    return;
  }

  try {
    const fileHandle = await open(file.path, "r");
    const signature = Buffer.alloc(5);

    try {
      await fileHandle.read(signature, 0, 5, 0);
    } finally {
      await fileHandle.close();
    }

    if (signature.toString() !== "%PDF-") {
      await unlink(file.path);
      res.status(400).json({ error: "Invalid PDF file" });
      return;
    }

    const extracted = await extractPdfText(file.path);
    const chunks = createChunks(extracted.pages);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in PDF");
    }

    const vectors = await generateEmbeddings(
      chunks.map((chunk) => chunk.content),
    );

    const client = await pool.connect();
    let document;

    try {
      await client.query("BEGIN");

      document = await insertDocument(client, file.originalname, file.path);

      await insertChunks(client, document.id, chunks);

      await updateChunkEmbeddings(client, document.id, chunks, vectors);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json({
      message: "PDF processed successfully",
      document: {
        ...document,
        status: "ready",
      },
      totalPages: extracted.totalPages,
      totalChunks: chunks.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Document processing failed";

    await unlink(file.path).catch(() => undefined);

    res.status(500).json({
      error: "Document processing failed",
      details: message,
    });
  }
});

export default router;
