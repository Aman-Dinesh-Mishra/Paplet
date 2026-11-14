import type { PoolClient } from "pg";
import type { DocumentChunk } from "./chunk.service.js";

export async function insertDocument(
  client: PoolClient,
  title: string,
  filePath: string,
) {
  const result = await client.query(
    `INSERT INTO documents (title, file_path)
     VALUES ($1, $2)
     RETURNING id, title, status, created_at`,
    [title, filePath],
  );

  return result.rows[0];
}

export async function insertChunks(
  client: PoolClient,
  documentId: string,
  chunks: DocumentChunk[],
): Promise<void> {
  for (let i = 0; i < chunks.length; i += 500) {
    const batch = chunks.slice(i, i + 500);
    const values: unknown[] = [];

    const placeholders = batch.map((chunk, index) => {
      const offset = index * 5;

      values.push(
        documentId,
        chunk.content,
        chunk.pageStart,
        chunk.pageEnd,
        chunk.chunkIndex,
      );

      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
    });

    await client.query(
      `INSERT INTO chunks
       (document_id, content, page_start, page_end, chunk_index)
       VALUES ${placeholders.join(", ")}`,
      values,
    );
  }
}

export const updateChunkEmbeddings = async (
  client: PoolClient,
  docId: string,
  chunks: DocumentChunk[],
  vectors: number[][],
): Promise<void> => {
  if (chunks.length !== vectors.length) {
    throw new Error("Chunk and embedding counts mismatch");
  }

  for (let i = 0; i < vectors.length; i += 500) {
    const batch = chunks.slice(i, i + 500);
    const vecs = vectors.slice(i, i + 500);
    const values: unknown[] = [];

    const placeholders = batch.map((chunk, index) => {
      const vector = vecs[index];

      if (!vector || vector.length !== 384 || !vector.every(Number.isFinite)) {
        throw new Error("Invalid embedding format");
      }

      values.push(chunk.chunkIndex, `[${vector.join(",")}]`);

      const offset = index * 2;

      return `($${offset + 1}::INTEGER, $${offset + 2}::VECTOR)`;
    });

    const result = await client.query(
      `UPDATE chunks AS c
       SET embedding = v.embedding
       FROM (VALUES ${placeholders.join(", ")}) AS v(chunk_index, embedding)
       WHERE c.document_id = $${values.length + 1}
       AND c.chunk_index = v.chunk_index`,
      [...values, docId],
    );

    if (result.rowCount !== batch.length) {
      throw new Error("Not all chunk embeddings were stored");
    }
  }
};
