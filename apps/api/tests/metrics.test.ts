import { describe, expect, it } from "vitest";
import {
  hitAtK,
  citationValidity,
  refusalAccuracy,
  p50Latency,
  p95Latency,
} from "../../../eval/metrics.js";

describe("hitAtK", () => {
  const results = [
    { documentId: "paper-1", pageStart: 1, pageEnd: 2 },
    { documentId: "paper-2", pageStart: 5, pageEnd: 6 },
    { documentId: "paper-1", pageStart: 7, pageEnd: 8 },
  ];

  it("returns true when a result matches the gold document and page", () => {
    expect(hitAtK(results, "paper-1", [7], 5)).toBe(true);
  });

  it("returns false when the document does not match", () => {
    expect(hitAtK(results, "paper-3", [7], 5)).toBe(false);
  });

  it("returns false when the page does not match", () => {
    expect(hitAtK(results, "paper-1", [10], 5)).toBe(false);
  });

  it("only considers the first K results", () => {
    expect(hitAtK(results, "paper-1", [7], 2)).toBe(false);
  });

  it("returns false for an empty gold page list", () => {
    expect(hitAtK(results, "paper-1", [], 5)).toBe(false);
  });
});

describe("citationValidity", () => {
  const chunks = [
    {
      id: "chunk-1",
      content: "Collaborative filtering uses user-item interactions.",
    },
  ];

  it("accepts a valid citation", () => {
    expect(
      citationValidity(
        {
          is_answerable: true,
          citations: [
            {
              chunkId: "chunk-1",
              quote: "Collaborative filtering uses user-item interactions.",
            },
          ],
        },
        chunks,
      ),
    ).toBe(true);
  });

  it("rejects an unknown chunk ID", () => {
    expect(
      citationValidity(
        {
          is_answerable: true,
          citations: [{ chunkId: "unknown", quote: "Some quote" }],
        },
        chunks,
      ),
    ).toBe(false);
  });

  it("rejects an altered quote", () => {
    expect(
      citationValidity(
        {
          is_answerable: true,
          citations: [{ chunkId: "chunk-1", quote: "Different content" }],
        },
        chunks,
      ),
    ).toBe(false);
  });

  it("rejects an answerable response without citations", () => {
    expect(
      citationValidity({ is_answerable: true, citations: [] }, chunks),
    ).toBe(false);
  });

  it("accepts a refusal without citations", () => {
    expect(
      citationValidity({ is_answerable: false, citations: [] }, chunks),
    ).toBe(true);
  });
});

describe("refusalAccuracy", () => {
  it("accepts an answer to an answerable question", () => {
    expect(refusalAccuracy("answerable", true)).toBe(true);
  });

  it("rejects a refusal to an answerable question", () => {
    expect(refusalAccuracy("answerable", false)).toBe(false);
  });

  it("accepts a refusal to an unanswerable question", () => {
    expect(refusalAccuracy("unanswerable", false)).toBe(true);
  });

  it("rejects an answer to an unanswerable question", () => {
    expect(refusalAccuracy("unanswerable", true)).toBe(false);
  });
});

describe("latency percentiles", () => {
  const latencies = [500, 100, 300, 200, 400];

  it("calculates p50 latency", () => {
    expect(p50Latency(latencies)).toBe(300);
  });

  it("calculates p95 latency", () => {
    expect(p95Latency(latencies)).toBe(500);
  });

  it("returns null for an empty latency list", () => {
    expect(p50Latency([])).toBeNull();
    expect(p95Latency([])).toBeNull();
  });
});
