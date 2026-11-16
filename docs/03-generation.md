# Answer Generation

## Overview

Paplet generates research-paper answers using retrieved passages and Groq-powered LLM inference.

## Pipeline

1. Validate the question using the shared Zod schema.
2. Generate a query embedding and retrieve the top 5 relevant chunks using pgvector.
3. Reject requests with no relevant evidence or retrieval similarity below the configured threshold.
4. Construct a prompt using the question and retrieved passages.
5. Generate a structured response using Groq.
6. Validate the response schema and verify citations against retrieved chunks.
7. Return the answer or a safe refusal.

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

- Rejects empty and invalid requests.
- Uses retrieved context as untrusted input.
- Enforces structured JSON output and Zod validation.
- Verifies citation IDs and quoted text against retrieved chunks.
- Returns a safe refusal for insufficient evidence or invalid generated output.
- Retries transient LLM failures (429, 5xx, and network errors) using exponential backoff with jitter and deadline limits.

## Configuration

The API requires:

- `GROQ_API_KEY`
- `LLM_MODEL`

## Limitations

- Retrieval similarity is a heuristic, not a confidence score.
- Citation validation confirms textual support, not the factual correctness of the generated answer.
- PDF mathematical notation may require additional extraction and rendering improvements.
