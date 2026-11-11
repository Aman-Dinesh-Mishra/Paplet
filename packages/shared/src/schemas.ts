import { z } from "zod";

export const AskRequestSchema = z.object({
  question: z.string().min(1),
  paperIds: z.array(z.string().uuid()).optional(),
});

export const CitationSchema = z.object({
  paperId: z.string(),
  chunkId: z.string(),
  page: z.number().int().optional(),
  snippet: z.string(),
});

export const AskResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type AskResponse = z.infer<typeof AskResponseSchema>;
