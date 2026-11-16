import { describe, expect, it } from "vitest";
import { validateCitations } from "../src/services/citation.service.js";

const chunks = [
  {
    id: "chunk-1",
    content:
      "Collaborative filtering uses Alternating Least Squares to model user preferences.",
  },
];

const validAnswer = {
  citations: [
    {
      chunkId: "chunk-1",
      quote: "Collaborative filtering uses Alternating Least Squares",
    },
  ],
};
describe("validateCitations", () => {
  it("accepts a valid citation", () => {
    const result = validateCitations(validAnswer, chunks);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
it("handles Unicode compatibility and whitespace differences", () => {
  const chunks = [
    {
      id: "chunk-1",
      content:
        "Increased regularization strength ( λ ) to prevent overfitting.",
    },
  ];

  const answer = {
    citations: [
      {
        chunkId: "chunk-1",
        quote:
          "Increased regularization strength ( λ ) to prevent overfitting.",
      },
    ],
  };

  expect(validateCitations(answer, chunks).valid).toBe(true);
});

it("rejects visually similar but different Unicode characters", () => {
  const chunks = [
    {
      id: "chunk-1",
      content: "Regularization strength (휆) prevents overfitting.",
    },
  ];

  const answer = {
    citations: [
      {
        chunkId: "chunk-1",
        quote: "Regularization strength (λ) prevents overfitting.",
      },
    ],
  };

  const result = validateCitations(answer, chunks);

  expect(result.valid).toBe(false);
});
