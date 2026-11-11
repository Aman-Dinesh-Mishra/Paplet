# 00-Brief: Project Paplet

## Problem Statement

Reading multiple research papers to compare methods, find evidence, or extract insights is slow, and generic chat assistants that return answers without verifiable citations cannot be trusted.

## Target User

A student or researcher working with 3 to 20 PDFs on a specific research topic.

## Goals (MVP)

- Upload PDFs and display them with processing statuses.
- Ask questions and receive answers with precise citations (e.g., Paper Title, p. 7).
- Gracefully refuse to answer when retrieved context lacks supporting evidence.
- Measure system quality quantitatively with a golden evaluation set.

## Non-Goals (Scope Protections)

- No user account creation, authentication, or billing workflows in the MVP.
- No OCR processing for scanned image-only PDFs in the MVP.
- No claim that the model autonomously proves research gaps; gap analysis consists of hypotheses backed by retrieved text.
- Not a production SaaS; framed as a constrained free-tier engineering demo.

## Success Metrics

- Retrieval Hit Rate @ k=5: > 80%
- Citation Validity: 100% (every cited page actually contains supporting text)
- Refusal Accuracy: 100% correct declines on unanswerable test queries
- Latency & Cost: p95 latency under 5s, baseline token cost tracked per query
