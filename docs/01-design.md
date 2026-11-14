# 01 – Design

## 1. Architecture Overview

Paplet follows a modular architecture with a React frontend, Express API, PostgreSQL vector storage, and external LLM integration.

```text
React + TypeScript
        |
     REST API
        |
Express + TypeScript
   |                |
   v                v
Document          Question
Ingestion         Answering
   |                |
   v                v
Extract           Embed Query
   |                |
Chunk              v
   |             Vector Search
Embed              |
   |                v
   v             Context + LLM
PostgreSQL          |
+ pgvector          v
                Citation Validation
```

**Technology responsibilities:**

- **Frontend:** React and TypeScript for document uploads and research-paper interaction.
- **API:** Express and TypeScript for ingestion, retrieval, and request orchestration.
- **Database:** PostgreSQL with pgvector for document metadata, text chunks, and vector embeddings.
- **Embedding model:** `all-MiniLM-L6-v2` for 384-dimensional text embeddings.
- **LLM:** Groq API for answer generation.

The ingestion pipeline and embedding persistence are implemented. Semantic retrieval and answer generation are subsequent implementation stages.

## 2. Data Model & Database Schema

Paplet uses PostgreSQL hosted on Supabase with the `pgvector` extension. Relational metadata and vector embeddings are stored in the same database.

### 2.1 Tables

#### `documents`

Stores uploaded PDF metadata and processing status.

| Column          | Type        | Description                              |
| --------------- | ----------- | ---------------------------------------- |
| `id`            | UUID        | Primary key, generated automatically     |
| `title`         | TEXT        | Original PDF filename                    |
| `file_path`     | TEXT        | Local storage path or storage identifier |
| `status`        | TEXT        | `processing`, `ready`, or `failed`       |
| `error_message` | TEXT        | Nullable processing failure details      |
| `created_at`    | TIMESTAMPTZ | Creation timestamp                       |

#### `chunks`

Stores extracted text segments, page metadata, and vector embeddings.

| Column        | Type        | Description                                                      |
| ------------- | ----------- | ---------------------------------------------------------------- |
| `id`          | UUID        | Primary key, generated automatically                             |
| `document_id` | UUID        | Foreign key referencing `documents(id)` with `ON DELETE CASCADE` |
| `content`     | TEXT        | Extracted text segment                                           |
| `page_start`  | INT         | Starting page number                                             |
| `page_end`    | INT         | Ending page number                                               |
| `chunk_index` | INT         | Sequential chunk position within a document                      |
| `embedding`   | VECTOR(384) | Nullable 384-dimensional embedding                               |
| `created_at`  | TIMESTAMPTZ | Creation timestamp                                               |

**Chunking configuration:**

- Target chunk size: 220 tokens.
- Maximum chunk size: 256 tokens.
- Overlap: 12% of the target size.
- Page metadata is preserved for citation generation.

The embedding dimension corresponds to the `all-MiniLM-L6-v2` model.

### 2.2 Document Processing Lifecycle

The current implementation uses three document statuses:

| Status       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `processing` | Document ingestion is in progress                                           |
| `ready`      | Text extraction, chunking, and embedding persistence completed successfully |
| `failed`     | Available status for processing failures                                    |

A document is marked `ready` only after its chunks and embeddings have been persisted successfully.

**Persistence guarantees:**

- Document insertion, chunk insertion, embedding updates, and the final status update execute within a database transaction.
- A failed transaction is rolled back to prevent partial database records.
- The API validates embedding dimensions and numerical values before persistence.
- The current rollback strategy does not retain a failed document record; persistent failure tracking is a future improvement.

### 2.3 Vector Storage and Indexing

Paplet uses pgvector to store embeddings as `VECTOR(384)`.

For semantic retrieval, the planned indexing strategy uses an HNSW (Hierarchical Navigable Small World) index with cosine distance.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX chunks_embedding_hnsw_idx
ON chunks
USING hnsw (embedding vector_cosine_ops);
```

This index is planned for the retrieval stage and should be applied through a database migration before being considered implemented.

## 3. Security & Reliability Considerations

### 3.1 PDF Validation and Extraction

**Risk:** Malformed PDFs, unusual layouts, or unsupported content can produce incomplete or corrupted text.

**Mitigation:**

- Validate PDF signatures and MIME types.
- Enforce upload size limits.
- Reject PDFs without extractable text.
- Preserve page metadata during extraction.

### 3.2 Prompt Injection

**Risk:** Uploaded documents may contain malicious instructions intended to manipulate the LLM.

**Mitigation:**

- Treat retrieved document content as untrusted input.
- Separate system instructions from retrieved context.
- Never allow document content to override system-level instructions.

### 3.3 Citation Integrity

**Risk:** The LLM may generate unsupported page references, source identifiers, or quotations.

**Mitigation:**

- Associate retrieved chunks with their source document and page metadata.
- Validate citation references against the retrieved context.
- Avoid presenting unsupported citations as verified sources.

### 3.4 Embedding Integrity

**Risk:** Failed embedding generation or incomplete persistence can leave chunks without valid vectors.

**Mitigation:**

- Validate vector dimensions and numerical values before database insertion.
- Use transactions for consistent document and chunk persistence.
- Verify the expected number of updated embeddings.
- Exclude NULL embeddings from vector retrieval.
