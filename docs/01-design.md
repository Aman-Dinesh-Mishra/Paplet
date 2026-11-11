# 01 – Design

## 1. Architecture Overview

```text
Browser (React + TS)
        │
   REST (JSON)
        ▼
Express + TS API
  ├── Ingestion: Upload PDF ──> Parse Text/Page ──> Chunk ──> Embed ──> Store DB
  └── Ask: Embed Query ──> Vector Search (top-k) ──> Prompt LLM ──> Validate Citations
        │
        ▼
Postgres + pgvector (Supabase) ──> LLM API (Groq) / Local Embedding Model
```

## 2. Data Model & Database Schema

We use PostgreSQL hosted on Supabase with the `pgvector` extension enabled. This allows us to combine relational document tracking with high-dimensional vector similarity search in a single database transaction.

### 2.1 Tables

#### `documents`

Tracks uploaded PDF file metadata and processing lifecycle states.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, `DEFAULT gen_random_uuid()` |
| `title` | TEXT | Not Null, extracted title or filename |
| `file_path` | TEXT | Not Null, storage identifier |
| `status` | TEXT | `'processing'`, `'ready'`, or `'failed'` |
| `error_message` | TEXT | Nullable, stores failure context |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

#### `chunks`

Stores segmented text blocks mapped to page ranges and vector coordinates.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, `DEFAULT gen_random_uuid()` |
| `document_id` | UUID | Foreign Key references `documents(id)` ON DELETE CASCADE |
| `content` | TEXT | Not Null, raw markdown/text chunk (~300–500 tokens) |
| `page_start` | INT | Not Null, starting page number for citations |
| `page_end` | INT | Not Null, ending page number |
| `chunk_index` | INT | Not Null, relative ordering index |
| `embedding` | VECTOR(384) | Vector dimension matching `all-MiniLM-L6-v2` model |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

### 2.2 Vector Indexing Strategy

To optimize nearest-neighbor similarity searches at scale, we create an HNSW (Hierarchical Navigable Small World) index on the embedding column using cosine distance (`vector_cosine_ops`):

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Create HNSW index for fast approximate nearest neighbor (ANN) search
create index chunks_embedding_hnsw_idx
on chunks
using hnsw (embedding vector_cosine_ops);
```

## 3. System Threats & Basic Mitigations

### Threat 1: Dirty Data & Extraction Failures

- **Risk:** PDFs with multi-column layouts, tables, or weird formatting can break text parsing, leading to corrupted text chunks and bad vector searches.
- **Mitigation:** Implement basic cleaning (strip running headers/footers) and enforce strict file size/MIME type limits on uploads.

### Threat 2: Prompt Injection via PDF Text

- **Risk:** A malicious PDF could contain hidden text like "Ignore previous instructions" designed to hijack the LLM.
- **Mitigation:** Structure the system prompt so the model treats retrieved document chunks strictly as untrusted data rather than instructions.

### Threat 3: Hallucinated Citations

- **Risk:** The LLM might generate a good answer but invent fake page numbers or attribute quotes incorrectly.
- **Mitigation:** Write code-level checks to verify that cited source IDs and quotes actually exist within the retrieved text chunks before showing them to the user.
