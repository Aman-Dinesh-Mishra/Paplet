import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { SearchRequestSchema, SearchResponseSchema } from "@paplet/shared";
import { retrieveChunks } from "../services/retrieval.service.js";

type SearchRequestBody = z.infer<typeof SearchRequestSchema>;

export const searchController = async (
  req: Request<Record<string, string>, unknown, SearchRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { query, topK, documentIds } = req.body;

    const { results, latencyMs } = await retrieveChunks(
      query,
      topK,
      documentIds,
    );

    const response = SearchResponseSchema.parse({
      results,
      latencyMs,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
