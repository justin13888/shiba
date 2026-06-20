# Cross-device sync

> Status: outline — expanded in Phase 5.

Offline-first sync over an end-to-end **encrypted** Yjs document. The server is a
blind relay of opaque ciphertext (see [encryption](./encryption.md)).

## Topology
- Background service worker owns the single WebSocket.
- Every context persists the doc via `y-indexeddb`; live cross-context updates via `BroadcastChannel`.
- Device identity = `deviceId` + server-issued device token.

## Protocol (seq-based; server can't read content)
1. `hello{ lastSeq }` → server streams `update{ seq, nonce, ct }` for `seq > lastSeq`.
2. Client decrypts, `Y.applyUpdate`, advances cursor; flushes queued `push{ ct, nonce }`.
3. Server assigns `seq`, `ack`s, and `broadcast`s to the account's other sockets.

## Offline & conflicts
Updates queue in IDB; reconnect replays idempotently. All convergence is Yjs's
(logical clocks — never wall-clock). Reorder/move conflicts resolved by `(order,
id)` sort + reconcile repair.

## Compaction
Client-driven: a device merges the log, uploads an encrypted baseline snapshot,
and the server prunes superseded updates.

## Failure modes
Server down, partial push, tampered blob (GCM auth failure), schema skew, device
revocation, wrong passphrase.
