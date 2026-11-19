# ADR 002: PostgreSQL with pgvector over FAISS

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Paplet requires persistent storage for documents, extracted chunks and embeddings, along with similarity-based retrieval and user-level data isolation.

FAISS was considered as an alternative vector search solution.

## Decision

Use Supabase PostgreSQL with pgvector for vector storage and similarity search.

Use cosine distance with an HNSW index for retrieval.

## Consequences

**Benefits**

- Relational data and embeddings share one database.
- Document ownership can be enforced through database queries.
- Persistent storage without maintaining a separate vector database.
- HNSW supports approximate nearest-neighbour search.

**Trade-offs**

- Vector search and relational workloads share database resources.
- Retrieval performance depends on dataset size, indexing and query planning.
- Database availability becomes a dependency for document retrieval.
