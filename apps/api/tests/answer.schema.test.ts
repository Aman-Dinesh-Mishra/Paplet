import { describe, expect, it } from "vitest";
import { AnswerSchema } from "@paplet/shared";

const validAnswer = {
  answer: "Collaborative filtering uses user-item interactions.",
  citations: [
    {
      chunkId: "550e8400-e29b-41d4-a716-446655440000",
      quote: "The system uses user-item interaction data.",
    },
  ],
  is_answerable: true,
};

describe("AnswerSchema", () => {
  it("accepts an answer with valid citations", () => {
    expect(AnswerSchema.safeParse(validAnswer).success).toBe(true);
  });

  it("accepts an unanswerable response without citations", () => {
    const response = {
      answer: "The retrieved passages do not contain sufficient evidence.",
      citations: [],
      is_answerable: false,
    };

    expect(AnswerSchema.safeParse(response).success).toBe(true);
  });

  it("rejects an answerable response without citations", () => {
    const response = {
      ...validAnswer,
      citations: [],
    };

    expect(AnswerSchema.safeParse(response).success).toBe(false);
  });

  it("rejects an unanswerable response with citations", () => {
    const response = {
      ...validAnswer,
      is_answerable: false,
    };

    expect(AnswerSchema.safeParse(response).success).toBe(false);
  });

  it("rejects an invalid chunk ID", () => {
    const response = {
      ...validAnswer,
      citations: [{ chunkId: "invalid-id", quote: "Supporting quote." }],
    };

    expect(AnswerSchema.safeParse(response).success).toBe(false);
  });

  it("rejects empty answers and quotes", () => {
    const emptyAnswer = {
      ...validAnswer,
      answer: "   ",
    };

    const emptyQuote = {
      ...validAnswer,
      citations: [{ ...validAnswer.citations[0], quote: "   " }],
    };

    expect(AnswerSchema.safeParse(emptyAnswer).success).toBe(false);
    expect(AnswerSchema.safeParse(emptyQuote).success).toBe(false);
  });
});
