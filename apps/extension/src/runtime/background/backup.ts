import {
    exportShiba,
    materializeDocSnapshot,
    parseShiba,
    type RestoreResult,
    serializeShiba,
    shibaToSnapshot,
} from "@shiba/core";
import { yjsAdapter } from "@shiba/crdt-yjs";
import type { WorkerRuntime } from "./runtime";

const dateLabel = (now: number): string =>
    new Date(now).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });

/**
 * Restore a stored snapshot as a new, labelled workspace (non-destructive). The
 * snapshot's Yjs bytes are decoded in a throwaway document, read as a plain
 * DocSnapshot, and rematerialized with fresh ids — so restore only ever *adds*
 * data and can't fight sync.
 */
export function restoreSnapshotById(
    runtime: WorkerRuntime,
    snapshotState: Uint8Array,
    takenAt: number,
): RestoreResult {
    const decoded = yjsAdapter.load(runtime.deviceId, snapshotState).snapshot();
    let result: RestoreResult = { workspaceIds: [] };
    runtime.doc.mutate((tx) => {
        result = materializeDocSnapshot(tx, runtime.deps, decoded, {
            label: `restored ${dateLabel(takenAt)}`,
        });
    });
    return result;
}

/** Serialize the whole live document as a portable `.shiba.json` backup. */
export function exportBackup(runtime: WorkerRuntime, now: number): string {
    return serializeShiba(exportShiba(runtime.doc.snapshot(), now));
}

/**
 * Import a `.shiba.json` backup as a new, labelled workspace (non-destructive).
 * Throws on a malformed/foreign file (validated by `parseShiba`).
 */
export function importBackup(
    runtime: WorkerRuntime,
    json: string,
    now: number,
): RestoreResult {
    const decoded = shibaToSnapshot(parseShiba(json));
    let result: RestoreResult = { workspaceIds: [] };
    runtime.doc.mutate((tx) => {
        result = materializeDocSnapshot(tx, runtime.deps, decoded, {
            label: `imported ${dateLabel(now)}`,
        });
    });
    return result;
}
