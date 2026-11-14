import { describe, expect, it, test } from "vitest";
import { createChunks } from "../src/services/chunk.service";

describe("createChunks", () => {
  it("returns an empty array for empty input", () => {
    expect(createChunks([])).toEqual([]);
  });

  it("returns an empty array for pages containing only whitespace", () => {
    expect(createChunks(["   ", "\n\t"])).toEqual([]);
  });

  it("creates one chunk for a short page", () => {
    const chunks = createChunks(["Machine learning is useful."], {
      targetTokens: 20,
      maxTokens: 30,
      overlapRatio: 0,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].pageStart).toBe(1);
    expect(chunks[0].pageEnd).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it("splits a sentence that exceeds the maximum token count", () => {
    const chunks = createChunks(
      [
        "Machine learning helps computers identify complex patterns in large datasets.",
      ],
      {
        targetTokens: 5,
        maxTokens: 5,
        overlapRatio: 0,
      },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.tokenCount <= 5)).toBe(true);
  });

  it("packs sentences up to the target token boundary", () => {
    const chunks = createChunks(["Alpha beta. Gamma delta. Epsilon zeta."], {
      targetTokens: 6,
      maxTokens: 10,
      overlapRatio: 0,
    });

    expect(chunks[0].content).toBe("Alpha beta. Gamma delta.");
    expect(chunks[0].tokenCount).toBe(6);
  });

  it("preserves sentence overlap between consecutive chunks", () => {
    const chunks = createChunks(["Alpha. Beta. Gamma."], {
      targetTokens: 3,
      maxTokens: 6,
      overlapRatio: 0.67,
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toContain("Beta.");
    expect(chunks[1].content).toContain("Beta.");
  });

  it("preserves page ranges when a chunk spans multiple pages", () => {
    const chunks = createChunks(["Alpha beta.", "Gamma delta."], {
      targetTokens: 10,
      maxTokens: 20,
      overlapRatio: 0,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].pageStart).toBe(1);
    expect(chunks[0].pageEnd).toBe(2);
  });

  it("produces deterministic output for identical input", () => {
    const pages = [
      "Machine learning is useful. It identifies patterns.",
      "Deep learning uses neural networks.",
    ];

    expect(createChunks(pages)).toEqual(createChunks(pages));
  });

  it("assigns sequential chunk indexes", () => {
    const chunks = createChunks(["Alpha. Beta. Gamma. Delta."], {
      targetTokens: 2,
      maxTokens: 5,
      overlapRatio: 0,
    });

    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(
      chunks.map((_, index) => index),
    );
  });

  test.each([
    { pages: ["Alpha beta."], expectedChunks: 1 },
    { pages: ["Alpha beta.", "Gamma delta."], expectedChunks: 1 },
  ])("handles different page inputs", ({ pages, expectedChunks }) => {
    const chunks = createChunks(pages, {
      targetTokens: 20,
      maxTokens: 30,
      overlapRatio: 0,
    });

    expect(chunks).toHaveLength(expectedChunks);
  });

  it("rejects invalid chunking options", () => {
    expect(() =>
      createChunks(["Alpha beta."], {
        targetTokens: 300,
        maxTokens: 256,
        overlapRatio: 0.12,
      }),
    ).toThrow("Invalid chunking options");
  });
});
