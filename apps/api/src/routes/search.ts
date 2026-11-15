import { Router } from "express";
import { performance } from "node:perf_hooks";
import { SearchRequestSchema, SearchResponseSchema } from "@paplet/shared";
import { pool } from "../db/pool.js";
import { generateEmbedding } from "../services/embedding.service.js";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = SearchRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid search request",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const startTime = performance.now();

    const { query, topK, documentIds } = parsed.data;

    const embedding = await generateEmbedding(query);

    const result = await pool.query(
      `SELECT *
       FROM match_chunks(
         $1::VECTOR,
         $2::INTEGER,
         $3::UUID[]
       )`,
      [`[${embedding.join(",")}]`, topK, documentIds ?? null],
    );

    const results = result.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      pageStart: row.page_start,
      pageEnd: row.page_end,
      similarity: Number(row.similarity),
    }));

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    const response = SearchResponseSchema.parse({
      results,
      latencyMs,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Search failed:", error);

    res.status(500).json({
      error: "Search operation failed",
    });
  }
});

export default router;
