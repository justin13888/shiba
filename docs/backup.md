# Local backups (safety-net)

A default-on, device-local backup of the whole document. It's a deliberate
**safety-net** while the CRDT/sync layer matures: even if sync or a merge goes
wrong, an untouched local copy of recent state is one click from recovery. It is
independent of the server and of encryption — snapshots are plaintext, on-device
only (the local device is trusted; see [encryption](./encryption.md)).

## Capture

The background worker runs an **hourly** `alarms` pass (`runScheduledBackup` →
`runRetention`):

1. Encode the full document (`doc.encodeState()`), hash it (`hashBytes`, a fast
   non-cryptographic digest used only for change-detection).
2. `planCapture` (pure, in `core/snapshot`) decides: capture only if a retention
   cadence is **due** *and* the content **changed** since the newest snapshot — so
   idle hours cost nothing.
3. If capturing, store a `Snapshot { state, stateHash, createdAt, deviceId,
   triggers, tabCount, groupCount }` and evict everything past retention.

A snapshot is written **atomically** — `IdbSnapshotStore.put` writes its metadata
and blob in a single IndexedDB transaction, so a crash can't leave a half-written
backup. "Snapshot now" in the UI forces a capture (bypassing the cadence) whenever
the content differs from the newest snapshot.

## Retention

The shipped policy (`DEFAULT_RETENTION_POLICIES`) is a single tier: **hourly, kept
for one week, auto-evicted after**. At most ~168 snapshots, usually far fewer
thanks to change-detection.

## Restore (non-destructive)

Restoring — from a stored snapshot or an imported file — never overwrites current
data. The snapshot's bytes are decoded to a plain `DocSnapshot` and rematerialized
by core's `materializeDocSnapshot` as **brand-new entities under a new "restored
…"/"imported …" workspace** (fresh ids, remapped refs, preserved timestamps). This
sidesteps the CRDT-merge paradox (re-applying old state can't "un-delete" or roll
back) and means restore can't fight sync — it only ever adds data. Review the new
workspace and delete what you don't want.

## Export / import

`Export…` downloads the whole live document as a portable, human-readable
`shiba-backup-<date>.json` (`exportShiba`, validated on the way back in by
`parseShiba`). `Import…` restores such a file as a new workspace via the same
non-destructive path. This is the ultimate hedge: a backup that depends on neither
IndexedDB nor the CRDT machinery.

## Settings & storage

The default-on toggle lives in `storage.local` under `backup.enabled` — **device-
local and intentionally not synced**, because backups are per-device. It's read by
both the worker's snapshot alarm and the Options page. Disabling it stops automatic
capture; manual "Snapshot now" and export/import still work.

## Where it lives

| Concern | Location |
|---|---|
| Pure decision (retention + change-gate) | `packages/core/src/snapshot/{retention,capture,hash}.ts` |
| Restore materializer (pure) | `packages/core/src/doc/restore.ts` |
| Backup file format | `packages/core/src/import-export/shiba.ts` |
| Durable store (atomic) | `adapters/storage-idb` (`IdbSnapshotStore`) |
| Capture / evict orchestration | `apps/extension/src/runtime/background/snapshots.ts` |
| Restore / export / import | `apps/extension/src/runtime/background/backup.ts` |
| Hourly alarm | `apps/extension/src/runtime/background/alarms.ts` |
| Setting | `apps/extension/src/runtime/settings.ts` |
| UI | `apps/extension/src/ui/settings/BackupSection.tsx` |
