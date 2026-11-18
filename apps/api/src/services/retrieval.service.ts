import { performance } from "node:perf_hooks";
import { pool } from "../db/pool.js";
import { generateEmbedding } from "./embedding.service.js";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  similarity: number;
};

export type RetrievalResult = {
  results: RetrievedChunk[];
  latencyMs: number;
};

export const retrieveChunks = async (
  query: string,
  topK = 5,
  documentIds?: string[],
): Promise<RetrievalResult> => {
  const startTime = performance.now();

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

  const results: RetrievedChunk[] = result.rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    similarity: Number(row.similarity),
  }));

  const latencyMs = Number((performance.now() - startTime).toFixed(2));

  return {
    results,
    latencyMs,
  };
};
