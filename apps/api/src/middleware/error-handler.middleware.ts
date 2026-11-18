import type { Request, Response, NextFunction } from "express";
import multer from "multer";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  req.log.error({ err: error, requestId: req.id }, "Unhandled API error");

  if (res.headersSent) {
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: "File upload failed",
      details: error.message,
      requestId: req.id,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    requestId: req.id,
  });
};
