import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { retrieveChunksMock, generateAnswerMock } = vi.hoisted(() => ({
  retrieveChunksMock: vi.fn(),
  generateAnswerMock: vi.fn(),
}));

vi.mock("../src/services/retrieval.service.js", () => ({
  retrieveChunks: retrieveChunksMock,
}));

vi.mock("../src/services/answer.service.js", () => ({
  generateAnswer: generateAnswerMock,
}));

import { askController } from "../src/controllers/ask.controller.js";

describe("askController", () => {
  const mockRequest = {
    body: {
      question: "How does collaborative filtering work?",
      paperIds: undefined,
    },
    user: {
      id: "test-user-id",
      email: "test@example.com",
    },
  } as unknown as Request<
    Record<string, string>,
    unknown,
    {
      question: string;
      paperIds?: string[];
    }
  >;

  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const mockNext = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves 12 chunks and returns the generated answer", async () => {
    const retrievedChunks = [
      {
        id: "chunk-1",
        documentId: "document-1",
        content: "Collaborative filtering uses user-item interactions.",
        pageStart: 1,
        pageEnd: 1,
        similarity: 0.85,
      },
    ];

    const answer = {
      answer: "Collaborative filtering uses user-item interactions.",
      citations: [
        {
          chunkId: "chunk-1",
          quote: "Collaborative filtering uses user-item interactions.",
        },
      ],
      is_answerable: true,
    };

    retrieveChunksMock.mockResolvedValue({
      results: retrievedChunks,
      latencyMs: 50,
    });

    generateAnswerMock.mockResolvedValue(answer);

    await askController(mockRequest, mockResponse, mockNext);

    expect(retrieveChunksMock).toHaveBeenCalledWith(
      "test-user-id",
      "How does collaborative filtering work?",
      12,
      undefined,
    );

    expect(generateAnswerMock).toHaveBeenCalledWith(
      "How does collaborative filtering work?",
      retrievedChunks,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(answer);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("forwards retrieval errors to the error handler", async () => {
    const error = new Error("Retrieval failed");

    retrieveChunksMock.mockRejectedValue(error);

    await askController(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("forwards answer generation errors to the error handler", async () => {
    const error = new Error("Answer generation failed");

    retrieveChunksMock.mockResolvedValue({
      results: [],
      latencyMs: 50,
    });

    generateAnswerMock.mockRejectedValue(error);

    await askController(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
