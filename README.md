# Kiwanja Block

Offline-first land registry.

| Layer    | Tech                                         | Folder      |
|----------|----------------------------------------------|-------------|
| Client   | React 19 + Vite PWA, PouchDB (local storage) | `client/`   |
| Server   | Express 5 (plain JavaScript, ESM)            | `server/`   |
| Database | CouchDB 3.4 (Docker), synced with PouchDB    | `couchdb/`  |
| Security | SHA-256 record hashing (Web Crypto / Node)   |             |
| Identity | Mock NIDA API (`GET /api/nida/verify/:nin`)  | `server/src/lib/nida.js` |

## Prerequisites

Node.js 20.12+ (`nvm use` picks it up from `.nvmrc`), npm 10+, Docker, Git.

## Environment

`.env` (project root, read by Docker Compose and the server):

```
COUCHDB_USER=admin
COUCHDB_PASSWORD=changeme
```

`client/.env`:

```
VITE_COUCHDB_URL=http://localhost:5984/land_records
VITE_COUCHDB_USER=admin
VITE_COUCHDB_PASSWORD=changeme
```

## Getting started

```bash
nvm use
docker compose up -d                       # CouchDB on http://localhost:5984 (Fauxton UI at /_utils)

cd server && npm install && npm run dev    # http://localhost:3000/api
cd client && npm install && npm run dev    # http://localhost:5173
```

Server tests: `cd server && npm test` (Node's built-in test runner).

## How it fits together

- **Offline-first:** the PWA writes to a local PouchDB database in the browser and
  live-syncs it two-way with CouchDB's `land_records` database. It keeps working offline and
  catches up when the connection returns.
- **Integrity:** each land record carries a SHA-256 hash of its content (keys sorted, so the
  hash is deterministic). The client (`client/src/lib/hash.ts`) and server
  (`server/src/lib/hashing.js`) compute identical hashes, so either side can detect tampering.
- **NIDA:** `server/src/lib/nida.js` is a mock with three test citizens. Swap `verifyNin()`
  for a real client when API access is available.

Mock NINs: `19850412-11111-00001-21`, `19900723-22222-00002-15`, `19781130-33333-00003-08`.

## Known dev-only shortcuts

- The client syncs to CouchDB with the admin credentials from `client/.env`, which are
  bundled into the browser code. Before production, the server should issue per-user CouchDB
  credentials (or proxy sync) and CORS origins in `couchdb/local.ini` should be tightened.
