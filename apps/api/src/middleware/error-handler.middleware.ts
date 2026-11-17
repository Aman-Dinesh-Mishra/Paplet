import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("Unhandled API error:", error);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: "Internal server error",
  });
};
