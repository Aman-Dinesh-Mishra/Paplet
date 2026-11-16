# Answer Generation

## Overview

Paplet generates research-paper answers using retrieved passages and Groq-powered LLM inference.

## Pipeline

1. Validate the question using the shared Zod schema.
2. Generate a query embedding.
3. Retrieve the top 5 relevant chunks from PostgreSQL using pgvector.
4. Construct a prompt containing the question and retrieved context.
5. Generate a structured JSON response using Groq.
6. Parse and validate the response using `AnswerSchema`.

## Response Contract

```json
{
  "answer": "Generated answer",
  "citations": [
    {
      "chunkId": "retrieved-chunk-uuid",
      "quote": "Supporting passage"
    }
  ],
  "is_answerable": true
}
```

Unanswerable responses contain no citations and set `is_answerable` to `false`.

## Reliability

- Rejects empty and whitespace-only questions.
- Skips LLM generation when retrieval returns no chunks.
- Enforces JSON output and validates the response structure.
- Treats retrieved content as untrusted input.

## Limitations

Citation IDs and quotes are structurally validated but are not yet verified against retrieved chunks. Citation verification and unsupported-answer handling are addressed in Day 9.

Groq inference requires `GROQ_API_KEY` and `LLM_MODEL` in the API environment.
