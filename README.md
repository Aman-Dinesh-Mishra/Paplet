# Paplet

**A RAG-powered research paper assistant for contextual question answering with source citations.**

## Architecture

<img width="1536" height="1024" alt="Paplet Architecture" src="https://github.com/user-attachments/assets/81c13f57-97d7-4a4f-8fcc-44552194d3f4" />

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| PDF Processing | pdf-parse |
| Embeddings | Transformers.js, all-MiniLM-L6-v2 |
| LLM | Groq |
| Testing & Evaluation | Vitest, Custom Evaluation Harness |

## Core Workflow

1. Upload research papers in PDF format.
2. Extract text and split documents into overlapping chunks.
3. Generate 384-dimensional embeddings and store them in PostgreSQL.
4. Retrieve relevant passages using pgvector similarity search.
5. Generate context-grounded answers using Groq.
6. Validate citations against retrieved passages and return safe refusals when evidence is insufficient.

## Reliability & Evaluation

- Citation verification against retrieved source passages.
- Exponential backoff with jitter for transient LLM failures.
- Retrieval evaluation using Hit@5.
- Citation validity and refusal accuracy metrics.
- Retrieval determinism checks and latency measurements.
