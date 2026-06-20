import {
    type CrdtDocument,
    type DocTx,
    type OpDeps,
    ops,
    queries,
} from "@shiba/core";
import { yjsAdapter } from "@shiba/crdt-yjs";
import { createIdbStores } from "@shiba/storage-idb";
import { nanoid } from "nanoid";
import { browser } from "wxt/browser";

const DOC_ID = "shiba";

async function resolveDeviceId(): Promise<string> {
    const { deviceId } = await browser.storage.local.get("deviceId");
    if (typeof deviceId === "string") return deviceId;
    const id = nanoid();
    await browser.storage.local.set({ deviceId: id });
    return id;
}

/** The wired application core: a persisted CRDT document plus bound mutation. */
export interface Runtime {
    readonly doc: CrdtDocument;
    readonly deps: OpDeps;
    commit(fn: (tx: DocTx) => void): void;
}

/**
 * Composition root — the only place adapters are wired to the core. Loads the
 * document from IndexedDB and persists the full state on every change (local
 * commits and applied remote sync updates alike), so reloads and offline edits
 * always survive. Guarantees a default workspace exists.
 */
export async function createRuntime(): Promise<Runtime> {
    const deviceId = await resolveDeviceId();
    const { docStore } = createIdbStores();
    const persisted = await docStore.load(DOC_ID);

    const doc = yjsAdapter.create(deviceId);
    if (persisted.snapshot) doc.applyUpdate(persisted.snapshot, "local");
    for (const update of persisted.updates) doc.applyUpdate(update, "local");

    doc.subscribe(() => void docStore.compact(DOC_ID, doc.encodeState()));

    const deps: OpDeps = {
        clock: { now: () => Date.now() },
        ids: { next: () => nanoid() },
    };
    const commit = (fn: (tx: DocTx) => void): void => {
        doc.mutate(fn);
    };

    if (queries.liveWorkspaces(doc.snapshot()).length === 0) {
        commit((tx) => {
            const ws = ops.createWorkspace(tx, deps, {
                name: "Personal",
                iconName: "house",
            });
            tx.workspaces.patch(ws.id, { isDefault: true });
        });
    }

    return { doc, deps, commit };
}
