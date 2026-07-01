import {
    applyCommand,
    type Command,
    type CommandResult,
    type CrdtDocument,
    type OpDeps,
    ops,
    queries,
    type SnapshotStore,
    type Unsubscribe,
} from "@shiba/core";
import { yjsAdapter } from "@shiba/crdt-yjs";
import { createIdbStores } from "@shiba/storage-idb";
import { toBase64 } from "@shiba/sync-protocol";
import { nanoid } from "nanoid";
import { browser } from "wxt/browser";

export const DOC_ID = "shiba";

async function resolveDeviceId(): Promise<string> {
    const { deviceId } = await browser.storage.local.get("deviceId");
    if (typeof deviceId === "string") return deviceId;
    const id = nanoid();
    await browser.storage.local.set({ deviceId: id });
    return id;
}

/**
 * The single owner of the CRDT document. Only the background service worker
 * constructs this, so it is the sole writer of IndexedDB — which is what removes
 * the multi-context clobber the old per-page `createRuntime` suffered. Every
 * change (a local {@link WorkerRuntime.dispatch} or an applied remote sync
 * update) is persisted as an incremental delta and pushed to {@link onUpdate}
 * subscribers, so pages mirror the document over the messaging port.
 */
export interface WorkerRuntime {
    readonly deviceId: string;
    readonly doc: CrdtDocument;
    readonly deps: OpDeps;
    readonly snapshots: SnapshotStore;
    /** Apply a command atomically; the result carries created/affected ids. */
    dispatch(cmd: Command): CommandResult;
    /** Subscribe to encoded (base64) deltas for every change, local or remote. */
    onUpdate(fn: (updateB64: string) => void): Unsubscribe;
    /** Full current state (base64) — hydrates a freshly connected page. */
    currentStateB64(): string;
    /** Collapse the append-log into a single baseline (the compaction alarm). */
    compact(): Promise<void>;
}

export async function buildWorkerRuntime(): Promise<WorkerRuntime> {
    const deviceId = await resolveDeviceId();
    const { docStore, snapshots } = createIdbStores();
    const persisted = await docStore.load(DOC_ID);

    const doc = yjsAdapter.create(deviceId);
    if (persisted.snapshot) doc.applyUpdate(persisted.snapshot, "local");
    for (const update of persisted.updates) doc.applyUpdate(update, "local");

    // The frontier tracks what has been persisted + broadcast. Deriving each
    // delta with `encodeStateSince` (rather than the mutation's return value)
    // uniformly captures local commits *and* applied remote updates.
    const listeners = new Set<(updateB64: string) => void>();
    let frontier = doc.stateVector();
    doc.subscribe(() => {
        const delta = doc.encodeStateSince(frontier);
        if (delta.length === 0) return;
        frontier = doc.stateVector();
        void docStore.appendUpdate(DOC_ID, delta);
        const encoded = toBase64(delta);
        for (const listener of listeners) listener(encoded);
    });

    const deps: OpDeps = {
        clock: { now: () => Date.now() },
        ids: { next: () => nanoid() },
    };

    if (queries.liveWorkspaces(doc.snapshot()).length === 0) {
        doc.mutate((tx) => {
            const ws = ops.createWorkspace(tx, deps, {
                name: "Personal",
                iconName: "house",
            });
            tx.workspaces.patch(ws.id, { isDefault: true });
        });
    }

    return {
        deviceId,
        doc,
        deps,
        snapshots,
        dispatch(cmd) {
            let result!: CommandResult;
            doc.mutate((tx) => {
                result = applyCommand(tx, deps, cmd);
            });
            return result;
        },
        onUpdate(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        currentStateB64: () => toBase64(doc.encodeState()),
        async compact() {
            await docStore.compact(DOC_ID, doc.encodeState());
        },
    };
}
