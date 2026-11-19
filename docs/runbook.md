# Runbook

## 1. Prerequisites

- Node.js 20 or later
- npm
- Supabase project with PostgreSQL and pgvector
- Groq API key

## 2. Repository Setup

Paplet is an npm workspaces monorepo:

- `apps/api` — Express and TypeScript backend
- `apps/web` — React and TypeScript frontend
- `packages/shared` — shared schemas and types

Install dependencies from the repository root:

```bash
npm install
```

Build the shared package:

```bash
npm run build:shared
```

## 3. Environment Configuration

Configure the following files locally:

- Backend: `apps/api/.env`
- Frontend: `apps/web/.env.local`

### Backend variables

| Variable                   | Purpose                      |
| -------------------------- | ---------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string |
| `GROQ_API_KEY`             | Groq API authentication      |
| `LLM_MODEL`                | Groq model identifier        |
| `SUPABASE_URL`             | Supabase project URL         |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key     |
| `ALLOWED_ORIGIN`           | Permitted frontend origin    |

### Frontend variables

| Variable                        | Purpose                  |
| ------------------------------- | ------------------------ |
| `VITE_API_URL`                  | Backend API base URL     |
| `VITE_SUPABASE_URL`             | Supabase project URL     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

Never commit environment files or expose secret values in logs.

Database credentials and the Groq API key must remain on the backend.

## 4. Local Development

Build the shared package:

```bash
npm run build:shared
```

Start the API in one terminal:

```bash
npm run dev:api
```

Start the frontend in another terminal:

```bash
npm run dev:web
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

The API uses port `4000` locally unless overridden by the `PORT` environment variable.

## 5. Backend Configuration

The PostgreSQL connection pool is configured with:

| Parameter           |     Value |
| ------------------- | --------: |
| Maximum connections |         5 |
| Idle timeout        | 30,000 ms |
| Connection timeout  |  5,000 ms |

The API server uses:

| Parameter          |      Value |
| ------------------ | ---------: |
| JSON body limit    |      32 KB |
| Request timeout    | 120,000 ms |
| Headers timeout    |  30,000 ms |
| Keep-alive timeout |   5,000 ms |

The backend enables Helmet, CORS, request logging, rate limiting, authentication middleware and centralized error handling.

The `/health` endpoint checks database connectivity using `SELECT 1`.

## 6. Verification

Run TypeScript checks:

```bash
npm run typecheck
```

Run backend tests:

```bash
npm run test --workspace=@paplet/api
```

Run lint:

```bash
npm run lint
```

Build all workspaces:

```bash
npm run build
```

Run the evaluation harness:

```bash
npm run eval
```

## 7. Deployment

Paplet uses separate Render services for its backend and frontend.

### Backend service

Build command:

```bash
npm ci && npm run build:shared && npm run build --workspace=@paplet/api
```

Start command:

```bash
npm run start --workspace=@paplet/api
```

The backend listens on the port supplied by Render through `PORT`.

Configure backend environment variables in the Render service settings.

### Frontend service

Build command:

```bash
npm ci && npm run build:shared && npm run build --workspace=@paplet/web
```

Publish directory:

```text
apps/web/dist
```

Configure frontend environment variables in the Render service settings.

Configure Supabase authentication redirect URLs for the deployed frontend origin.

The static site must rewrite application routes to `/index.html` to support client-side routing.

## 8. Common Operational Issues

| Symptom              | Areas to investigate                                |
| -------------------- | --------------------------------------------------- |
| API returns 503      | Database connectivity and `DATABASE_URL`            |
| Authentication fails | Supabase configuration and redirect URLs            |
| CORS errors          | Frontend origin and `ALLOWED_ORIGIN`                |
| PDF upload fails     | File validation, extraction and backend logs        |
| Answers are refused  | Retrieved passages and similarity threshold         |
| LLM requests fail    | Groq configuration, quota and provider errors       |
| Deployment fails     | Build logs, environment variables and Render events |

## 9. Operational Guidelines

- Never expose database credentials, API keys or access tokens.
- Preserve authentication and user ownership checks.
- Apply database migrations deliberately and verify their results.
- Verify database connectivity after deployment.
- Test PDF upload, retrieval and answer generation after significant changes.
- Use the evaluation dataset to assess retrieval changes instead of relying only on individual examples.
