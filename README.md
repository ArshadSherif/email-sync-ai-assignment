# Outbox

Outbox is a two-part email assistant: a TypeScript/Node backend that ingests and indexes emails, enriches them with AI (categorization and reply generation), and a Next.js frontend for browsing, searching, and replying to emails.

This README explains project structure, key libraries, how to run the app in development (including Docker for supporting services), environment variables, common issues, and quick troubleshooting tips.

## Quick summary
- Backend: `backend/` — Express + TypeScript. IMAP sync, Elasticsearch indexing, Qdrant vector store, AI classification and reply generation.
- Frontend: `frontend/` — Next.js 16 (React 19) app. Client UI with infinite scroll, filters, and search.
- Dev services (Docker): Elasticsearch and Qdrant (defined in `backend/docker-compose.yml`).

## Repo layout (important files)

- `backend/`
  - `package.json`, `tsconfig.json`
  - `docker-compose.yml` — Elasticsearch & Qdrant for local dev
  - `src/index.ts` — server bootstrap (sets up ES index, starts IMAP sync, Qdrant init)
  - `src/config/elasticsearch.ts` — ES client; reads `ELASTIC_URL`.
  - `src/config/imap.ts` — list of IMAP accounts configured via environment variables.
  - `src/routes/` — Express routes (`/api/emails`, `/api/ai`).
  - `src/controllers/` — request handlers (search, get, categorize, reply, etc.).
  - `src/services/` — AI services, IMAP sync (`imapflow` + `mailparser`), notifier services.
  - `src/utils/` — helpers: `prepareEmailContent`, `setupElastic`, vector DB init.

- `frontend/`
  - Next.js app using the `app/` router and client components in `components/`.
  - `lib/api.ts` — the frontend HTTP client (uses `process.env.NEXT_PUBLIC_API_URL`).

## Key libraries and what they do

- Backend
  - `express`, `cors` — HTTP server and CORS
  - `imapflow` — IMAP client for historical + IDLE-driven sync
  - `mailparser` — parse raw email sources into structured objects
  - `@elastic/elasticsearch` — Elasticsearch client (indexing + search)
  - `@qdrant/*` — Qdrant client / vector store for semantic search
  - `@xenova/transformers` — local embedding pipeline used for feature-extraction
  - `@google/generative-ai` — Google Gemini for classification/generation
  - `html-to-text` — convert HTML email body to plaintext for AI

- Frontend
  - `next`, `react` — UI
  - `axios` — HTTP
  - `tailwindcss` (dev) — styling

## Environment variables

Create a `.env` in `backend/` (see `backend/.env.example`) and set the following (examples):

```
ELASTIC_URL=http://localhost:9200
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=your_gemini_api_key
IMAP_USER_1=you@example.com
IMAP_PASS_1=yourpassword
IMAP_HOST_1=imap.example.com
IMAP_USER_2=
IMAP_PASS_2=
IMAP_HOST_2=
BACKEND_URL=http://localhost:3000
PORT=3000
```

Frontend uses `NEXT_PUBLIC_API_URL` to point to the backend (see `frontend/.env.example`). Example:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Note: keep real credentials out of version control; use `.env` locally and add secrets to your deployment platform.

## Running locally (development)

Prerequisites:
- Node.js 18+ (recommended)
- Docker & docker-compose (for Elasticsearch and Qdrant), or remote ES/Qdrant instances

1. Start supporting services

```bash
cd backend
docker compose up -d
```

This brings up Elasticsearch (9200) and Qdrant (6333) using `backend/docker-compose.yml`.

2. Install dependencies

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

3. Create `.env` files

Copy the example files added in this repo: `backend/.env.example` and `frontend/.env.example` and fill values.

4. Start backend in development (nodemon + ts-node)

```bash
cd backend
npm run dev
```

Startup actions:
- Prepares Elasticsearch index/mappings via `setupElasticIndex()`.
- Starts IMAP sync (`startIMAPSync()`): a historical 30-day fetch followed by persistent IDLE for live updates.
- Initializes Qdrant vector DB via `initQdrant()`.

5. Start frontend

```bash
cd frontend
# If backend runs on 3000, run frontend on another port
PORT=3001 npm run dev
```

Open the frontend in the browser (e.g., `http://localhost:3001`).

## Production build

- Backend
  ```bash
  cd backend
  npm run build
  npm start
  ```

- Frontend
  ```bash
  cd frontend
  npm run build
  npm start
  ```

For production deployments, you likely want Dockerfiles, proper process managers, and secure storage for secrets.

## Docker notes

- `backend/docker-compose.yml` runs Elasticsearch (8.14) and Qdrant. It disables ES security for dev by setting `xpack.security.enabled=false`. Adjust for production and read ES docs about security and memory tuning.
- Volumes `es_data` and `qdrant_data` persist data between runs.
- Elasticsearch requires `vm.max_map_count` larger than default on some systems; if ES fails to start, check the container logs and host kernel settings.

## API overview
- `GET /api/emails` — paginated list (query params: `page`, `size`, `folder`, `accountId`)
- `GET /api/emails/:id` — get a single email
- `GET /api/emails/search?q=...` — search (subject/body/from/to)
- `POST /api/ai/suggest-reply` — generate an AI reply (see `frontend/lib/api.ts` usage)

Refer to `backend/src/routes` and `backend/src/controllers` for exact request/response shapes used by the frontend.

## Known issues & troubleshooting

- TypeScript cannot find types for `@xenova/transformers` — add a local `declare module "@xenova/transformers";` to suppress or create proper types. The code currently uses a permissive `any` around the embedder.
- Qdrant client import mismatch: code imports `@qdrant/js-client-rest` but `package.json` lists `@qdrant/qdrant-js`. If you hit runtime import errors, either install the client used in code or update imports to match the installed package.
- Elasticsearch connection errors: ensure `ELASTIC_URL` is correct and ES has finished booting. Check `docker compose logs elasticsearch`.
- IMAP connection errors: ensure credentials and host are correct; IMAP hosts sometimes require app-specific passwords or OAuth.

## Suggested next steps / improvements

- Add `backend/.env.example` (added here) and `frontend/.env.example` (added here).
- Add a minimal `Dockerfile` for backend and frontend and expand `docker-compose` to build/run them for a one-command dev start.
- Add type declarations for `@xenova/transformers` or replace with an SDK that ships types.
- Add integration tests that mock IMAP & ES to validate the ingest pipeline.

---