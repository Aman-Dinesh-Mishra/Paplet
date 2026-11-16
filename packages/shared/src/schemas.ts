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
  question: z.string().trim().min(1, "Question cannot be empty"),
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

export const SearchRequestSchema = z.object({
  query: z.string().trim().min(1, "Question can't be empty"),
  topK: z.number().int().min(1).max(20).default(5),
  documentIds: z.array(z.string().uuid()).optional(),
});

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string(),
  pageStart: z.number().int(),
  pageEnd: z.number().int(),
  similarity: z.number(),
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  latencyMs: z.number().nonnegative(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const AnswerCitationSchema = z.object({
  chunkId: z.string().uuid(),
  quote: z.string().trim().min(1),
});

export const AnswerSchema = z
  .object({
    answer: z.string().trim().min(1),
    citations: z.array(AnswerCitationSchema),
    is_answerable: z.boolean(),
  })
  .superRefine((data, context) => {
    if (!data.is_answerable && data.citations.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citations"],
        message: "Unanswerable responses can't contain citations",
      });
    }

    if (data.is_answerable && data.citations.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citations"],
        message: "Answerable responses must contain at least one citation",
      });
    }
  });

export type AnswerCitation = z.infer<typeof AnswerCitationSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
