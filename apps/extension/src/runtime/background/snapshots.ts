import {
    DEFAULT_RETENTION_POLICIES,
    hashBytes,
    planCapture,
    type Snapshot,
    type SnapshotMeta,
} from "@shiba/core";
import { readBackupSettings } from "../settings";
import type { WorkerRuntime } from "./runtime";

const liveCount = (
    records: Readonly<Record<string, { deletedAt: number | null }>>,
): number => Object.values(records).filter((r) => r.deletedAt === null).length;

/**
 * The local backup pass: capture a full snapshot when a retention cadence is due
 * and the document changed since the last one, then evict everything past the
 * one-week window. `force` (a manual "Snapshot now") captures whenever the content
 * differs from the newest snapshot, regardless of cadence. Returns whether it
 * captured. The full `doc.encodeState()` is stored atomically by the snapshot
 * store (single IndexedDB transaction).
 */
export async function runRetention(
    runtime: WorkerRuntime,
    now: number,
    opts: { force?: boolean } = {},
): Promise<boolean> {
    const metas = await runtime.snapshots.list();
    const state = runtime.doc.encodeState();
    const stateHash = hashBytes(state);
    const plan = planCapture(metas, DEFAULT_RETENTION_POLICIES, now, stateHash);
    const newest = metas.reduce<SnapshotMeta | undefined>(
        (n, m) => (!n || m.createdAt > n.createdAt ? m : n),
        undefined,
    );
    const changed = newest?.stateHash !== stateHash;

    let captured = false;
    if (plan.shouldCapture || (opts.force && changed)) {
        const snap = runtime.doc.snapshot();
        const snapshot: Snapshot = {
            id: runtime.deps.ids.next(),
            createdAt: now,
            deviceId: runtime.deviceId,
            triggers: plan.triggers.length > 0 ? plan.triggers : ["hourly"],
            tabCount: liveCount(snap.tabs),
            groupCount: liveCount(snap.groups),
            stateHash,
            state,
        };
        await runtime.snapshots.put(snapshot);
        captured = true;
    }
    for (const id of plan.expiredIds) await runtime.snapshots.delete(id);
    return captured;
}

/** Snapshot-alarm entry point: only runs when the safety-net is enabled. */
export async function runScheduledBackup(
    runtime: WorkerRuntime,
    now: number,
): Promise<void> {
    if ((await readBackupSettings()).enabled) await runRetention(runtime, now);
}
