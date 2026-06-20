# 🐕 Shiba

A cute home page and tab manager browser extension — built to supersede OneTab with
sensible organization and **end-to-end encrypted, offline-first cross-device sync**.

> **Status:** v2 ground-up rewrite. The domain core, CRDT sync engine, encryption, and
> self-hostable server are implemented and tested; the extension UI surfaces are being
> layered on top of that finished engine (see [Feature status](#feature-status)).

## Why Shiba

OneTab is great at one thing — stash a pile of tabs and get them back. Shiba keeps that
one-click muscle memory but adds real organization (workspaces → folders → lists → tabs,
plus cross-cutting tags) and **sync you can actually trust**: offline-first, conflict-free
(CRDT), and end-to-end encrypted so a self-hosted server only ever stores ciphertext.

## Feature status

| Area | State |
|---|---|
| Save / restore tabs, workspaces, saved lists, rename, search | ✅ working in the extension |
| Popup quick-actions, context-menu save, keyboard commands | ✅ working |
| Domain model, ordering, trash + restore, self-healing reconcile | ✅ implemented & unit-tested |
| Import (OneTab / BetterOneTab / Shiba JSON), v1→v2 migration | ✅ implemented & tested |
| CRDT (Yjs) + IndexedDB persistence | ✅ implemented & tested |
| End-to-end encryption (passphrase envelope, AES-256-GCM) | ✅ implemented & tested |
| Sync engine (offline-first, encrypted) + self-hostable server | ✅ implemented & tested |
| Snapshot retention, hybrid search ranking, analytics aggregation | ✅ core logic implemented & tested |
| Folders / tags / trash / snapshots / analytics **UI**, drag-and-drop, command palette, sync setup UI, semantic-search model, themes | 🚧 integration layer over the finished engine |

Everything green: `pnpm lint && pnpm typecheck && pnpm test` (~95 tests; `@shiba/core` ≥ 90% coverage).

## Architecture & key decisions

Shiba is a **pnpm-workspace monorepo** organized as ports & adapters around one idea: the
**CRDT document is the single source of truth**, and everything else is an adapter around
it. Local edits and remote (synced) updates flow through the *same* reactive path.

```
packages/core          Pure domain: model, ports (interfaces), doc ops/queries/reconcile,
                       import/export, search & analytics math, the sync engine. No browser,
                       Solid, IndexedDB, Yjs, network, or crypto-impl imports.
packages/sync-protocol Wire contract shared by the extension and server (encrypted blobs).
adapters/crdt-yjs      CrdtDocument port → Yjs.
adapters/storage-idb   DocStore / SnapshotStore → IndexedDB.
adapters/crypto-webcrypto  CryptoEngine port → WebCrypto + Argon2id (envelope E2E).
apps/extension         WXT + Solid UI; composition root wires adapters to core.
apps/server            Hono + better-sqlite3 self-hostable sync relay (Node, no Bun).
```

Decisions, and why:

- **CRDT = Yjs.** The most mature, widely-deployed CRDT, and pure-JS (no WASM) so it runs
  cleanly in MV3 service workers and across browsers. It sits behind a `CrdtDocument` port,
  so the choice is reversible. Records are stored as nested `Y.Map`s for field-level merge;
  tags are a conflict-free set.
- **Ordering = fractional indexing**, not integer `order` fields. "Reorder" and "move to
  another container" become the *same* single, conflict-free field write. Records sort by
  `(order, id)` with `id` as a deterministic tiebreaker.
- **End-to-end encryption (envelope).** A random data key (DEK) encrypts everything with
  AES-256-GCM; the DEK is wrapped by a key derived from your passphrase via Argon2id. The
  server stores only ciphertext + a non-secret salt — it cannot read your tabs. See
  [`docs/encryption.md`](docs/encryption.md).
- **Offline-first sync.** Edits apply locally first and persist to IndexedDB; the engine
  encrypts and pushes deltas, decrypts and merges remote updates, and pushes full state on
  reconnect so an offline edit can never be lost. Replay is idempotent. See
  [`docs/sync.md`](docs/sync.md).
- **Server = Hono + better-sqlite3 on Node — no Bun-specific dependencies**, so it runs
  anywhere Node does and self-hosts as one process + one SQLite file.
- **UI = Solid.js + Kobalte + Tailwind.** Tiny, fast, and a great fit for an extension;
  the CRDT→Solid bridge uses `reconcile` so only components reading changed records re-render.
- **Validation = Valibot** (tiny, tree-shakeable) as the single source of truth for model
  types. **Lint/format = Biome.** **Strict TypeScript** with `noUncheckedIndexedAccess`.

Deeper write-ups live in [`docs/`](docs/): `architecture`, `data-model`, `sync`,
`encryption`, `sync-server`, `search`, `analytics`, `testing`.

## Getting started (development)

Prerequisites: **Node 20+** and **pnpm 9**.

```bash
pnpm install
pnpm --filter @shiba/extension dev          # Chrome dev build with HMR
pnpm --filter @shiba/extension dev:firefox   # Firefox
```

WXT prints an unpacked extension directory — load it via `chrome://extensions` →
"Load unpacked" (or use WXT's auto-launch). Workspace-wide commands:

```bash
pnpm build       # build every package
pnpm typecheck   # tsc --noEmit across the workspace
pnpm test        # vitest across the workspace
pnpm lint        # biome check
```

## Self-hosting the sync server

The server is a single Node process backed by one SQLite file.

```bash
SHIBA_SERVER_SECRET=$(openssl rand -hex 32) \
DB_PATH=./shiba.sqlite \
PORT=3000 \
pnpm --filter @shiba/server start
```

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP/WebSocket port |
| `DB_PATH` | `./shiba.sqlite` | SQLite database file |
| `SHIBA_SERVER_SECRET` | — | Bootstrap secret that authorizes minting device tokens |
| `LOG_LEVEL` | `info` | pino log level |

**Pairing a device:** `POST /devices` with `Authorization: Bearer $SHIBA_SERVER_SECRET`
returns a one-time **device token**; the extension stores it and uses it for the WebSocket
(`/sync`). Your **passphrase** (never sent to the server) derives the key that decrypts your
data. Two layers: the token gates relay access, the passphrase gates readability. Back up the
server by copying the SQLite file. Full API and schema: [`docs/sync-server.md`](docs/sync-server.md).

## Privacy

Shiba is local-first. Your data lives in the browser; the optional sync server stores only
end-to-end-encrypted blobs. There is no third-party telemetry — analytics are computed and
kept on-device.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
