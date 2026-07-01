import type { Command, CommandResult, DocSnapshot } from "@shiba/core";
import { createStore, reconcile } from "solid-js/store";
import type { BridgeClient } from "../runtime/bridge/client";

/**
 * Bridges the mirrored CRDT document to Solid reactivity. Every worker broadcast
 * flows through the same `subscribe → reconcile` path, so the UI reacts
 * identically to this page's own edits and to edits from other contexts (or a
 * restored snapshot). `reconcile` structurally diffs the snapshot, so only
 * components reading changed records re-render. Mutations go out via `dispatch`.
 */
export interface ShibaStore {
    readonly snap: DocSnapshot;
    dispatch(cmd: Command): Promise<CommandResult>;
    dispose(): void;
}

export function createShibaStore(client: BridgeClient): ShibaStore {
    const [snap, setSnap] = createStore<DocSnapshot>(client.doc.snapshot());
    const unsubscribe = client.doc.subscribe(() =>
        setSnap(reconcile(client.doc.snapshot())),
    );
    return {
        snap,
        dispatch: (cmd) => client.dispatch(cmd),
        dispose: () => {
            unsubscribe();
            client.dispose();
        },
    };
}
