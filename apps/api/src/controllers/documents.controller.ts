import type { Request, Response, NextFunction } from "express";
import { unlink } from "node:fs/promises";
import { extractPdfText } from "../services/pdf.service.js";
import { createChunks } from "../services/chunk.service.js";
import { pool } from "../db/pool.js";
import {
  insertDocument,
  insertChunks,
  updateChunkEmbeddings,
  markDocumentReady,
  listDocuments,
} from "../services/document.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";

export const listDocumentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const documents = await listDocuments(req.user!.id);

    res.status(200).json({ documents });
  } catch (error) {
    next(error);
  }
};

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
    const extracted = await extractPdfText(file.path);
    const chunks = createChunks(extracted.pages);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in PDF");
    }

    const vectors = await generateEmbeddings(
      chunks.map((chunk) => chunk.content),
    );

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const document = await insertDocument(
        client,
        file.originalname,
        file.path,
        req.user!.id,
      );

      await insertChunks(client, document.id, chunks);

      await updateChunkEmbeddings(client, document.id, chunks, vectors);

      const readyDocument = await markDocumentReady(
        client,
        document.id,
        req.user!.id,
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "PDF processed successfully",
        document: readyDocument,
        totalPages: extracted.totalPages,
        totalChunks: chunks.length,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    await unlink(file.path).catch(() => undefined);
    next(error);
  }
};
