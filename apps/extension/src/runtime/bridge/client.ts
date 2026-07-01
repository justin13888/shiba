import type { Command, CommandResult, CrdtDocument } from "@shiba/core";
import { yjsAdapter } from "@shiba/crdt-yjs";
import { fromBase64 } from "@shiba/sync-protocol";
import { browser } from "wxt/browser";
import {
    DOC_PORT,
    type DocPortMessage,
    sendMessage,
} from "@/src/messaging/protocol";

/** A page's live, read-only view of the worker-owned document + a mutation channel. */
export interface BridgeClient {
    /** Local mirror of the worker's document; stays live as the worker broadcasts. */
    readonly doc: CrdtDocument;
    /** Send a mutation to the worker; resolves with created/affected ids. */
    dispatch(cmd: Command): Promise<CommandResult>;
    dispose(): void;
}

/**
 * Connect a page to the worker-owned document. Opens the doc port, hydrates a
 * local mirror from the worker's initial state, then keeps it live by applying
 * each broadcast delta. Mutations never touch the mirror directly — they go to
 * the worker via `dispatch` and come back as a broadcast, so every page
 * converges on the worker's single source of truth.
 */
export function connectBridge(): Promise<BridgeClient> {
    return new Promise((resolve) => {
        const port = browser.runtime.connect({ name: DOC_PORT });
        let mirror: CrdtDocument | null = null;
        const pending: string[] = [];
        port.onMessage.addListener((message: DocPortMessage) => {
            if (message.t === "init") {
                mirror = yjsAdapter.load(
                    message.deviceId,
                    fromBase64(message.state),
                );
                for (const update of pending)
                    mirror.applyUpdate(fromBase64(update), "remote");
                pending.length = 0;
                resolve({
                    doc: mirror,
                    dispatch: (cmd) => sendMessage("dispatch", cmd),
                    dispose: () => {
                        port.disconnect();
                        mirror?.destroy();
                    },
                });
            } else if (mirror) {
                mirror.applyUpdate(fromBase64(message.update), "remote");
            } else {
                pending.push(message.update);
            }
        });
    });
}
