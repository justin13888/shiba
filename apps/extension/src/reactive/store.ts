import type { DocSnapshot, DocTx } from "@shiba/core";
import { createStore, reconcile } from "solid-js/store";
import type { Runtime } from "../runtime/container";

/**
 * Bridges the CRDT document to Solid reactivity. Every change — a local commit
 * or an applied remote update — flows through the same `subscribe → reconcile`
 * path, so the UI reacts identically to local and synced edits. `reconcile`
 * structurally diffs the snapshot, so only components reading changed records
 * re-render.
 */
export interface ShibaStore {
    readonly snap: DocSnapshot;
    readonly deps: Runtime["deps"];
    commit(fn: (tx: DocTx) => void): void;
    dispose(): void;
}

export function createShibaStore(rt: Runtime): ShibaStore {
    const [snap, setSnap] = createStore<DocSnapshot>(rt.doc.snapshot());
    const dispose = rt.doc.subscribe(() =>
        setSnap(reconcile(rt.doc.snapshot())),
    );
    return { snap, deps: rt.deps, commit: rt.commit, dispose };
}
