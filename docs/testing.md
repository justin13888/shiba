# Testing

Tooling: **Vitest** (unit + integration), **fake-indexeddb** (storage adapter),
**@solidjs/testing-library** + jsdom (components), and **Playwright** for E2E with
the extension loaded. Ports/adapters keep most logic testable without a browser.

## Layers

- **Unit (pure, Node) — `core`:** model/schemas, `doc/{ops,queries,reconcile}`, the
  **command bus** (`commands/apply`), ordering, **snapshot `{retention,capture,hash}`**,
  **restore materializer** (`doc/restore`), import/export (onetab/better-onetab +
  the full-fidelity `shiba` round-trip), migration mapper, search ranking, analytics
  aggregation, crypto envelope. Exercised against the in-memory fake `CrdtDocument`
  + injected `testDeps`.
- **Convergence (real Yjs, headless):** conflicting op sequences cross-applied to
  identical snapshots (`adapters/crdt-yjs`).
- **Integration:** `storage-idb` vs `fake-indexeddb`; the encrypted sync engine vs an
  in-process blind relay over a loopback transport (asserting no plaintext on the
  wire); the **messaging-bridge convergence** (worker state + broadcast deltas keep
  page mirrors in sync); the **backup lifecycle** (capture/skip/evict + restore &
  file round-trip) against a fake worker runtime.
- **Component (jsdom):** the accessible primitives and saved-view pieces — asserting
  roles, accessible names, and keyboard operation.
- **Server:** HTTP (device minting, auth, key material, `last_seen_at`) **and** the
  `WS /sync` relay (hello→update→live catch-up, push→ack→fan-out).
- **E2E (Playwright, extension loaded):** the user journeys in
  [`QA.md`](./QA.md) — save/restore, trash+undo, search, backup capture/restore,
  export/import, settings, two-context reactivity, and a two-instance encrypted-sync
  convergence check. Scaffolded for CI + human QA.

## Gates

`core/**` targets ≥ 90% coverage. CI runs `biome check` + `tsc --noEmit` +
`vitest run` across the workspace, plus the git hooks (`convco`, Biome) on commit.

## Human QA

[`QA.md`](./QA.md) is the manual acceptance checklist — every criterion mapped to
steps and expected results — for the human-QA validation pass.
