# Paplet

A RAG-powered research-paper assistant: upload papers, ask questions, get answers with citations.

## Structure
- `apps/api` – Express + TypeScript backend (ingest, retrieval, answer generation)
- `apps/web` – React + Vite frontend
- `packages/shared` – Zod schemas shared by API and web
- `eval` – retrieval/answer quality evaluation
- `docs` – brief, design, ADRs, runbook, retro

## Getting started
```bash
cp .env.example .env
npm install
npm run dev:api
npm run dev:web
```
