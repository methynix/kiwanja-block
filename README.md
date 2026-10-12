# Kiwanja Block

Offline-first land sale integrity layer. A sale is recorded at the plot with the seller, buyer and
Mwenyekiti each signing in order on one phone. The server re-verifies everything and seals it.

| Layer    | Tech                                                      | Folder    |
|----------|-----------------------------------------------------------|-----------|
| Client   | React 19, React Router 7, Vite PWA, PouchDB (IndexedDB)   | `client/` |
| Server   | Express 5 (ESM), Zod, JWT + rotating refresh cookie       | `server/` |
| Database | CouchDB 3.4 in Docker                                     | `couchdb/`|

## Run it

```bash
nvm use                                  # Node 20+
cp .env.example .env                     # then set real values
docker compose up -d                     # CouchDB on :5984
cd server && npm install && npm run seed -- --reset && npm run dev   # API on :3000
cd client && npm install && npm run dev  # app on :5173
```

`npm run seed -- --reset` wipes the kiwanja_* databases and creates demo users and plots.

## Demo accounts

| Role        | Phone          | Password       |
|-------------|----------------|----------------|
| Officer     | +255700000001  | Officer-2026!  |
| Mwenyekiti  | +255700000002  | Leader-2026!   |
| Mwenyekiti  | +255700000003  | Leader-2026!   |
| Citizen     | +255700000011  | Citizen-2026!  |
| Citizen     | +255700000012  | Citizen-2026!  |

Mock NIDA citizens are in `server/src/modules/nida/nida.data.js`.

## Tests

`cd server && npm test` and `cd client && npx tsc -b && npx oxlint`.
