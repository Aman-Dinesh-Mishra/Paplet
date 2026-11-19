# Paplet

Paplet is a research-paper assistant that uses Retrieval-Augmented Generation (RAG) to answer questions from uploaded PDF documents with supporting citations.

## Problem

Extracting specific information from research papers is time-consuming. General-purpose language models can also produce answers without reliable evidence from the source documents.

Paplet addresses this by retrieving relevant passages from uploaded papers and grounding generated answers in that retrieved context.

## Core capabilities

- Upload and process research-paper PDFs.
- Extract text while preserving page metadata.
- Split documents into overlapping text chunks.
- Generate vector embeddings and store them in PostgreSQL using pgvector.
- Retrieve relevant passages through semantic similarity search.
- Generate answers using an external LLM.
- Validate citations against retrieved passages.
- Refuse answers when sufficient supporting evidence is unavailable.
- Authenticate users and restrict document retrieval to the document owner.

## Target users

Students and researchers who need to search and ask questions across collections of research papers.

## System scope

Paplet focuses on document-grounded question answering.

It does not claim to independently verify scientific conclusions, establish research novelty, or prove research gaps. Generated answers are limited to the evidence available in retrieved document passages.

## Non-goals

- OCR for scanned image-only PDFs.
- Training or fine-tuning a foundation model.
- Autonomous scientific discovery.
- Guaranteed factual correctness of generated answers.
- Enterprise-scale multi-tenant infrastructure.

## Technology stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | React, TypeScript, Mantine   |
| API            | Node.js, Express, TypeScript |
| Authentication | Supabase Auth                |
| Database       | Supabase PostgreSQL          |
| Vector search  | pgvector                     |
| Embeddings     | Xenova/all-MiniLM-L6-v2      |
| LLM inference  | Groq API                     |
| Validation     | Zod                          |
| Deployment     | Render                       |

## Engineering priorities

1. Ground answers in retrieved document evidence.
2. Preserve source metadata for traceable citations.
3. Prevent users from accessing other users' documents.
4. Validate generated output before returning it.
5. Measure retrieval and answer reliability rather than relying only on demonstrations.

## Current limitations

- Retrieval quality varies with question phrasing and document content.
- Similarity scores are retrieval signals, not calibrated confidence values.
- Citation validation verifies textual support, not scientific correctness.
- Scanned PDFs are not supported by the current extraction pipeline.
- Evaluation coverage is limited by the manually labelled dataset and available LLM API quota.
