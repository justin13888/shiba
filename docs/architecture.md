# Architecture

> Status: outline — expanded in Phase 1.

Shiba is a pnpm-workspace monorepo built around one idea: **the CRDT document is
the single source of truth**, and everything else is an adapter around it.

## Layering (ports & adapters)

The dependency rule points inward. `@shiba/core` is pure and depends only on its
own `ports/`. Adapters implement those ports; the extension's composition root
(`runtime/container.ts`) is the only place concrete adapters are wired to core.

```
core (pure) ──▶ ports ◀── adapters (crdt-yjs, storage-idb, tabs-webext,
                                     transport-ws, crypto-webcrypto, embedder-model2vec)
   ▲                              ▲
   └── ui (Solid) ── reactive bridge ──┘
```

| Package | Responsibility |
|---|---|
| `packages/core` | model, ports, doc ops/queries/reconcile, import/export, search & analytics math (pure) |
| `packages/sync-protocol` | client↔server wire contract |
| `adapters/*` | concrete browser/network/crypto implementations of core ports |
| `apps/extension` | WXT + Solid UI, composition root, reactive bridge |
| `apps/server` | Hono + Node + better-sqlite3 self-hostable sync relay |

## Where code runs
- **Background service worker:** owns the WebSocket sync connection and `alarms`.
- **Pages (index/popup/options):** read/write the doc via the reactive store.
- All contexts share one logical Yjs doc via `y-indexeddb` + a `BroadcastChannel`.

## Why ports & adapters
Core, sync, ordering, and import/export are functions of injected interfaces, so
~80% of logic is unit-testable in plain Node without a browser. See
[testing](./testing.md).
