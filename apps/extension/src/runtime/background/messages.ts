import { browser } from "wxt/browser";
import {
    DOC_PORT,
    type DocPortMessage,
    onMessage,
} from "@/src/messaging/protocol";
import type { WorkerRuntime } from "./runtime";

/**
 * Serve the messaging bridge from the worker: answer `dispatch` RPCs and stream
 * the document to every connected page over a long-lived port. A page's open
 * port both delivers live deltas and keeps the MV3 worker alive while that page
 * is visible.
 *
 * Listeners are registered synchronously (before any `await`) so events arriving
 * during worker startup are not dropped; the runtime is resolved lazily inside
 * each handler.
 */
export function serveBridge(getRuntime: () => Promise<WorkerRuntime>): void {
    onMessage("dispatch", async ({ data }) =>
        (await getRuntime()).dispatch(data),
    );

    browser.runtime.onConnect.addListener((port) => {
        if (port.name !== DOC_PORT) return;
        let unsubscribe: (() => void) | undefined;
        let closed = false;
        const post = (message: DocPortMessage): void => {
            try {
                port.postMessage(message);
            } catch {
                // Port closed between broadcast and delivery; ignore.
            }
        };
        void (async () => {
            const runtime = await getRuntime();
            if (closed) return;
            post({
                t: "init",
                deviceId: runtime.deviceId,
                state: runtime.currentStateB64(),
            });
            unsubscribe = runtime.onUpdate((update) =>
                post({ t: "update", update }),
            );
        })();
        port.onDisconnect.addListener(() => {
            closed = true;
            unsubscribe?.();
        });
    });
}
