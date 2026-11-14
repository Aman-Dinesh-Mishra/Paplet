import { describe, expect, it } from "vitest";
import {
  generateEmbedding,
  generateEmbeddings,
} from "../src/services/embedding.service";

describe("Embedding service", () => {
  it("generates a 384-dimensional embedding", async () => {
    const embedding = await generateEmbedding(
      "Machine learning helps computers learn from data.",
    );

    expect(embedding).toHaveLength(384);
    expect(embedding.every(Number.isFinite)).toBe(true);
  }, 30_000);

  it("generates normalized embeddings", async () => {
    const embedding = await generateEmbedding(
      "Research papers contain scientific information.",
    );

    const magnitude = Math.sqrt(
      embedding.reduce((sum, value) => sum + value * value, 0),
    );

    expect(magnitude).toBeCloseTo(1, 5);
  }, 30_000);

  it("generates one embedding for each input", async () => {
    const texts = [
      "Machine learning",
      "Natural language processing",
      "Vector databases",
    ];

    const embeddings = await generateEmbeddings(texts);

    expect(embeddings).toHaveLength(texts.length);

    for (const embedding of embeddings) {
      expect(embedding).toHaveLength(384);
      expect(embedding.every(Number.isFinite)).toBe(true);
    }
  }, 30_000);

  it("returns an empty array for empty batch input", async () => {
    const embeddings = await generateEmbeddings([]);

    expect(embeddings).toEqual([]);
  });

  it("rejects empty text", async () => {
    await expect(generateEmbedding("   ")).rejects.toThrow(
      "Cannot Generate an embedding for empty text",
    );
  });
});
