# Cross-device sync

Offline-first sync over an end-to-end **encrypted** Yjs document. The server is a
blind relay of opaque ciphertext (see [encryption](./encryption.md)).

## Topology

- The **background service worker** owns the single document and the single
  WebSocket (`manageSync`); the socket outlives any UI tab.
- Pages never sync directly — they mirror the worker's document over the bridge
  (see [architecture](./architecture.md)).
- Device identity = `deviceId` + a server-issued device token.
- Pairing (Options → `setupSync`) writes the server config + the unlocked key to
  device-local storage; the worker reacts to that write and (re)connects — no
  reload required.

## Protocol (seq-based; server can't read content)

Wire messages (`@shiba/sync-protocol`): client `hello | push | ping`; server
`update | ack | live | compactSuggested | pong`.

1. On connect the client sends `hello{ lastSeq }`; the server streams
   `update{ seq, blob }` for `seq > lastSeq`, then a `live` marker.
2. The client decrypts each blob, `applyUpdate`s it, and on `live` pushes its full
   state so an offline edit can't be missed.
3. A local edit is sealed and sent as `push{ ref, blob }`; the server assigns a
   `seq`, replies `ack{ ref, seq }`, and relays it as an `update` to the account's
   other sockets.

## Offline & conflicts

Updates are persisted locally (append-log) and replay idempotently on reconnect —
re-applying a known update is a CRDT no-op. All convergence is Yjs's (logical
clocks, never wall-clock). Reorder/move conflicts resolve by the `(order, id)` sort
plus the `reconcile` repair pass.

## Failure modes

Server down, partial push, tampered blob (GCM auth failure), wrong passphrase,
device revocation.

## Roadmap (not yet built)

- **Seq-cursor resume.** The client currently sends `hello{ lastSeq: 0 }` and
  re-streams from the start on each connect (idempotent, but not incremental).
  Persisting and resuming from a real cursor is future work.
- **Server-side compaction / baseline upload.** The server keeps the full append
  log; `compactSuggested` is defined in the protocol but not yet emitted or acted
  on, and there is no encrypted baseline-snapshot upload. Compaction is local-only
  today (a worker alarm). The device-local backup safety-net is separate — see
  [backup](./backup.md).
