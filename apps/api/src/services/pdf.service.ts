import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type pdfParse from "pdf-parse";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse") as typeof pdfParse;

export type ExtractedPdf = {
  pages: string[];
  totalPages: number;
};

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
};

export async function extractPdfText(filePath: string): Promise<ExtractedPdf> {
  const fileBuffer = await readFile(filePath);
  const pages: string[] = [];

  const result = await pdf(fileBuffer, {
    pagerender: async (pageData) => {
      const content = await pageData.getTextContent();
      const items = content.items as PdfTextItem[];

      const pageText = items
        .map((item) => {
          const text = item.str ?? "";
          return text + (item.hasEOL ? "\n" : " ");
        })
        .join("")
        .trim();

      pages.push(pageText);
      return pageText;
    },
  });

  if (!pages.some((page) => page.length > 0)) {
    throw new Error("PDF contains no extractable text");
  }

  return {
    pages,
    totalPages: result.numpages,
  };
}
