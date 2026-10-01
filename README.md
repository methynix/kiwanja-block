# Kiwanja Block

Offline-first land registry.

| Layer    | Tech                                         | Folder      |
|----------|----------------------------------------------|-------------|
| Frontend | React 19 + Vite PWA, PouchDB (local storage) | `frontend/` |
| Backend  | NestJS 12                                    | `backend/`  |
| Database | CouchDB 3.4 (Docker), synced with PouchDB    | `couchdb/`  |
| Security | SHA-256 record hashing (Web Crypto / Node)   |             |
| Identity | Mock NIDA API (`GET /api/nida/verify/:nin`)  | `backend/src/nida/` |

## Prerequisites

Node.js 20+ (`nvm use` picks it up from `.nvmrc`), npm 10+, Docker, Git.

## Getting started

```bash
nvm use
cp .env.example .env                    # CouchDB admin credentials
cp frontend/.env.example frontend/.env  # CouchDB URL the PWA syncs with
docker compose up -d                    # CouchDB on http://localhost:5984 (Fauxton UI at /_utils)

cd backend && npm install && npm run start:dev   # http://localhost:3000/api
cd frontend && npm install && npm run dev        # http://localhost:5173
```

## How it fits together

- **Offline-first:** the PWA writes to a local PouchDB database in the browser and
  live-syncs it two-way with CouchDB's `land_records` database. It keeps working offline and
  catches up when the connection returns.
- **Integrity:** each land record carries a SHA-256 hash of its content (keys sorted, so the
  hash is deterministic). The frontend (`src/lib/hash.ts`) and backend (`HashingService`)
  compute identical hashes, so either side can detect tampering.
- **NIDA:** `backend/src/nida/` is a mock with three test citizens. Swap `NidaService`
  for a real client when API access is available.

Mock NINs: `19850412-11111-00001-21`, `19900723-22222-00002-15`, `19781130-33333-00003-08`.

## Known dev-only shortcuts

- The frontend syncs to CouchDB with the admin credentials from `frontend/.env`, which are
  bundled into the client. Before production, the backend should issue per-user CouchDB
  credentials (or proxy sync) and CORS origins in `couchdb/local.ini` should be tightened.
