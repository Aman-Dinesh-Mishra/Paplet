import { z } from "zod";

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  LLM_MODEL: z.string().min(1),
  EMBEDDING_MODEL: z.string().default("all-MiniLM-L6-v2"),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("paplet-api"),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const AskRequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
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
