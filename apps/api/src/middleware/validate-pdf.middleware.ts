import type { Request, Response, NextFunction } from "express";
import { open, unlink } from "node:fs/promises";

export const validatePdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      error: "A PDF file is required",
    });
    return;
  }

  try {
    const fileHandle = await open(file.path, "r");
    const signature = Buffer.alloc(5);

    let isValidPdf: boolean;

    try {
      const { bytesRead } = await fileHandle.read(signature, 0, 5, 0);

      isValidPdf = bytesRead === 5 && signature.toString() === "%PDF-";
    } finally {
      await fileHandle.close();
    }

    if (!isValidPdf) {
      await unlink(file.path).catch(() => undefined);

      res.status(400).json({
        error: "Invalid PDF file",
      });
      return;
    }

    next();
  } catch (error) {
    await unlink(file.path).catch(() => undefined);
    next(error);
  }
};
