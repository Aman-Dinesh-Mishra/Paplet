# ADR 001: TypeScript for the Backend

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Paplet uses TypeScript for its React frontend. Using a separate backend language would introduce another runtime and increase the complexity of maintaining shared application contracts.

## Decision

Use Node.js, Express and TypeScript for the backend.

Shared TypeScript and Zod schemas are maintained in `packages/shared` and reused across the frontend and API.

## Consequences

**Benefits**

- Shared types and validation contracts.
- Consistent language across frontend and backend.
- Single Node.js development toolchain.

**Trade-offs**

- Embedding inference and PDF processing run within the Node.js backend, requiring attention to memory and processing limits.
- Python-specific ML libraries are not directly available in the backend runtime.
