import { validateCitations } from "../apps/api/src/services/citation.service.js";

type RetrievalResult = {
  documentId: string;
  pageStart: number;
  pageEnd: number;
};

type CitationAnswer = {
  is_answerable: boolean;
  citations: {
    chunkId: string;
    quote: string;
  }[];
};

type RetrievedChunk = {
  id: string;
  content: string;
};

export const hitAtK = (
  results: RetrievalResult[],
  goldDocument: string,
  goldPages: number[],
  k = 5,
): boolean => {
  if (k < 1 || goldPages.length === 0) {
    return false;
  }

  return results.slice(0, k).some((result) => {
    const correctDocument = result.documentId === goldDocument;

    const correctPage = goldPages.some(
      (page) => page >= result.pageStart && page <= result.pageEnd,
    );

    return correctDocument && correctPage;
  });
};

export const citationValidity = (
  answer: CitationAnswer,
  chunks: RetrievedChunk[],
): boolean => {
  if (answer.is_answerable && answer.citations.length === 0) {
    return false;
  }

  if (!answer.is_answerable && answer.citations.length > 0) {
    return false;
  }

  return validateCitations(answer, chunks).valid;
};

export const refusalAccuracy = (
  expectedType: "answerable" | "unanswerable",
  actualIsAnswerable: boolean,
): boolean => {
  return (
    (expectedType === "answerable" && actualIsAnswerable) ||
    (expectedType === "unanswerable" && !actualIsAnswerable)
  );
};

export const percentile = (
  latencies: number[],
  percentileValue: number,
): number | null => {
  if (latencies.length === 0) {
    return null;
  }

  if (percentileValue < 0 || percentileValue > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  if (latencies.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Latencies must be finite non-negative numbers");
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
};

export const p50Latency = (latencies: number[]): number | null =>
  percentile(latencies, 50);

export const p95Latency = (latencies: number[]): number | null =>
  percentile(latencies, 95);
