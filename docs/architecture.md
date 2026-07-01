# Architecture

Shiba is a Bun-workspace monorepo built around one idea: **the CRDT document is
the single source of truth**, and everything else is an adapter around it.

## Layering (ports & adapters)

The dependency rule points inward. `@shiba/core` is pure and depends only on its
own `ports/`. Adapters implement those ports; the extension's background worker is
the one place concrete adapters are wired to core.

```
core (pure) ──▶ ports ◀── adapters (crdt-yjs, crypto-webcrypto, storage-idb;
   ▲                                 tabs + transport live in the extension)
   └── ui (Solid) ── reactive store ── bridge ─┘
```

| Package | Responsibility |
|---|---|
| `packages/core` | model, ports, doc ops/queries/reconcile, the **command bus**, import/export, search & analytics math, snapshot retention (all pure) |
| `packages/sync-protocol` | client↔server wire contract |
| `adapters/crdt-yjs` · `crypto-webcrypto` · `storage-idb` | concrete Yjs / WebCrypto / IndexedDB implementations of core ports |
| `apps/extension` | WXT + Solid UI, the background worker that owns the document, and the messaging bridge; `src/adapters/{tabs,transport}` implement the two webext-specific ports |
| `apps/server` | Hono + Node + better-sqlite3 self-hostable sync relay |

## Where code runs

The **background service worker is the single owner** of the document. Only it:

- constructs the one `CrdtDocument` (`buildWorkerRuntime`) and persists it to
  IndexedDB as a compacted baseline plus an append-only delta log;
- runs the encrypted WebSocket sync engine against that doc (`manageSync`);
- runs the `alarms`: append-log compaction and the `reconcile` self-heal (plus the
  hourly snapshot — see [backup](./backup.md)).

Because the worker is the **sole IndexedDB writer**, the previous failure mode —
every page building its own doc and racing full-state writes to one key — is gone
by construction.

**Pages (index / popup / options) are thin clients.** On load a page opens a
long-lived port (`connectBridge`), hydrates a read-only **mirror** of the document
from the worker's state, then applies each broadcast delta to stay live. The
reactive Solid store subscribes to that mirror. The open port also keeps the MV3
worker alive while UI is visible; when every page closes, headless work continues
on alarms.

## Mutations: the command bus

Closures can't cross a `postMessage` boundary, so a page never mutates the document
directly. It sends a serializable `Command` (`store.dispatch(cmd)`); the worker
applies it centrally with `applyCommand` inside one `doc.mutate`, persists the
delta, and broadcasts it. Every page — the originator included — converges by
applying that broadcast, so there is exactly one source of truth. The command union
is exhaustive and unit-tested without a browser.

## Why ports & adapters

Core, the command bus, sync, ordering, reconcile, retention, and import/export are
functions of injected interfaces, so most logic is unit-testable in plain Node.
See [testing](./testing.md).

## Roadmap (not yet built)

- **Semantic search / embeddings.** `ports/embedder.ts` has no adapter (there is no
  `adapters/embedder-model2vec`); search today is the pure lexical + cosine math in
  `core/search` — see [search](./search.md).
- **Analytics wiring.** `core/analytics` aggregation is pure and ready, but no
  `AnalyticsSink` adapter is wired yet — see [analytics](./analytics.md).
