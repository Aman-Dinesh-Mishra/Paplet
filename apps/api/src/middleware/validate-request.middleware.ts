import type { RequestHandler } from "express";
import { z } from "zod";

export const validateRequest = <T extends z.ZodType>(
  schema: T,
): RequestHandler<Record<string, string>, unknown, z.infer<T>> => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
};
