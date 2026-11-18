import type { RequestHandler } from "express";
import { z } from "zod";

type ValidationTarget = "body" | "query" | "params";

export const validateRequest = <T extends z.ZodType>(
  schema: T,
  target: ValidationTarget = "body",
): RequestHandler => {
  return (req, res, next) => {
    const request = req as unknown as Record<ValidationTarget, unknown>;

    const parsed = schema.safeParse(request[target]);

    if (!parsed.success) {
      res.status(400).json({
        error: `Invalid request ${target}`,
        details: parsed.error.flatten(),
      });
      return;
    }

    request[target] = parsed.data;
    next();
  };
};
