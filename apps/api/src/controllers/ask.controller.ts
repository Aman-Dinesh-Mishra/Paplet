import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AskRequestSchema } from "@paplet/shared";
import { retrieveChunks } from "../services/retrieval.service.js";
import { generateAnswer } from "../services/answer.service.js";

type AskRequestBody = z.infer<typeof AskRequestSchema>;

const RETRIEVAL_TOP_K = 12;

export const askController = async (
  req: Request<Record<string, string>, unknown, AskRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { question, paperIds } = req.body;

    const { results } = await retrieveChunks(
      req.user!.id,
      question,
      RETRIEVAL_TOP_K,
      paperIds,
    );

    const answer = await generateAnswer(question, results);

    res.status(200).json(answer);
  } catch (error) {
    next(error);
  }
};
