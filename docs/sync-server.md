# Sync server (self-hosting)

> Status: outline — expanded in Phase 5.

Single-user, portable Node stack — **no Bun dependencies**: Hono +
`@hono/node-server` + `ws`, SQLite via `better-sqlite3` + Drizzle, pino logs.

## Auth
`SHIBA_SERVER_SECRET` bootstraps the instance; `POST /devices` (with the secret)
mints a device token (stored hashed). All other calls use the Bearer token.

## Endpoints
- `GET /healthz`
- `POST /devices` · `GET/DELETE /devices[/:id]`
- `GET/PUT /keys` — encrypted key material (salt, params, wrappedDEK)
- `WS /sync?token=` — `hello | push | ack | update | broadcast | snapshot`
- `GET/PUT /snapshots[/:id]` — optional encrypted history backup

## Storage (SQLite)
`device_tokens`, `key_material`, `doc_updates(seq, nonce, ciphertext)`,
`doc_snapshot(uptoSeq, nonce, ciphertext)`, `history_snapshots`.

## Configuration
`PORT`, `DB_PATH`, `SHIBA_SERVER_SECRET`, `LOG_LEVEL`. Backups = copy the SQLite
file. Container image, compose, and TLS notes: [`deployment.md`](deployment.md).
