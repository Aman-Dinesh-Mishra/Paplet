import type { Request, Response, NextFunction } from "express";
import { open, unlink } from "node:fs/promises";
import { extractPdfText } from "../services/pdf.service.js";
import { createChunks } from "../services/chunk.service.js";
import { pool } from "../db/pool.js";
import {
  insertDocument,
  insertChunks,
  updateChunkEmbeddings,
  markDocumentReady,
} from "../services/document.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";

export const uploadDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

      document = await markDocumentReady(client, document.id);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json({
      message: "PDF processed successfully",
      document,
      totalPages: extracted.totalPages,
      totalChunks: chunks.length,
    });
  } catch (error) {
    await unlink(file.path).catch(() => undefined);
    next(error);
  }
};
