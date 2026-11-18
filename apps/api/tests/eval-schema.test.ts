import { describe, expect, it } from "vitest";
import { EvaluationDatasetSchema } from "../../../eval/schema.js";

describe("EvaluationDatasetSchema", () => {
  const validAnswerable = {
    id: "nutrition-001",
    question: "What dietary patterns were identified?",
    type: "answerable",
    goldDocument: "3be06935-f6b7-4028-b722-2eb297071cc0",
    goldPages: [4],
    goldQuote: "Three major dietary patterns were identified.",
  };

  const validUnanswerable = {
    id: "unanswerable-001",
    question: "What is the capital of Japan?",
    type: "unanswerable",
    goldDocument: null,
    goldPages: [],
  };

  it("accepts a valid answerable question", () => {
    expect(EvaluationDatasetSchema.safeParse([validAnswerable]).success).toBe(
      true,
    );
  });

  it("accepts a valid unanswerable question", () => {
    expect(EvaluationDatasetSchema.safeParse([validUnanswerable]).success).toBe(
      true,
    );
  });

  it("rejects an invalid document UUID", () => {
    const invalid = {
      ...validAnswerable,
      goldDocument: "invalid-id",
    };

    expect(EvaluationDatasetSchema.safeParse([invalid]).success).toBe(false);
  });

  it("rejects an answerable question without gold pages", () => {
    const invalid = {
      ...validAnswerable,
      goldPages: [],
    };

    expect(EvaluationDatasetSchema.safeParse([invalid]).success).toBe(false);
  });

  it("rejects an unanswerable question with a document ID", () => {
    const invalid = {
      ...validUnanswerable,
      goldDocument: "3be06935-f6b7-4028-b722-2eb297071cc0",
    };

    expect(EvaluationDatasetSchema.safeParse([invalid]).success).toBe(false);
  });

  it("rejects duplicate question IDs", () => {
    expect(
      EvaluationDatasetSchema.safeParse([validAnswerable, validAnswerable])
        .success,
    ).toBe(false);
  });

  it("rejects an empty dataset", () => {
    expect(EvaluationDatasetSchema.safeParse([]).success).toBe(false);
  });
});
