# Testing

> Status: outline — expanded across phases.

Tooling: **Vitest** (unit + integration), **@solidjs/testing-library** + jsdom
(components/bridge), **fake-indexeddb** (storage adapter), **Playwright** (E2E with
the extension loaded). Ports/adapters make most logic testable without a browser.

## Layers
- **Unit (pure, Node):** fractional indexing, `doc/ops` + `reconcile` against an
  in-memory fake `CrdtDocument`, import/export parsers, search ranking (mock
  embedder), analytics aggregation, migration mapper, crypto envelope.
- **Convergence (real Yjs, headless):** conflicting op sequences cross-applied →
  identical snapshots.
- **Integration:** `storage-idb` vs `fake-indexeddb`; encrypted sync engine vs an
  in-process server over a loopback transport.
- **E2E (Playwright):** save/restore/reorder/tag/trash-undo/import/search + a
  two-context encrypted sync convergence test.

## Gates
`core/**` ≥ 90% coverage. CI runs `biome check` + `tsc --noEmit` + `vitest run`.
