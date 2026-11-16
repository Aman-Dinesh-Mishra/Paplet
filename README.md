# Paplet

**A RAG-powered research paper assistant for contextual question answering with source citations.**

## Architecture

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/81c13f57-97d7-4a4f-8fcc-44552194d3f4" />

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| Embeddings | Sentence Transformers |
| LLM | Groq |


## Core Workflow

1. Upload research papers.
2. Extract and chunk document text.
3. Generate and store embeddings.
4. Retrieve relevant passages using vector similarity.
5. Generate context-grounded answers with citations.

