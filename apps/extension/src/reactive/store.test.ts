import { applyCommand, type Command, queries } from "@shiba/core";
import { createFakeDoc, testDeps } from "@shiba/core/testing";
import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import type { BridgeClient } from "../runtime/bridge/client";
import { createShibaStore } from "./store";

/**
 * A stand-in for the real bridge: `dispatch` applies the command straight to the
 * mirror (as the worker's broadcast would), so the store's reactive path is
 * exercised without a live port.
 */
function fakeClient(): BridgeClient {
    const doc = createFakeDoc();
    const deps = testDeps();
    return {
        doc,
        dispatch: async (cmd: Command) => {
            let result = { ids: [] as string[] };
            doc.mutate((tx) => {
                result = applyCommand(tx, deps, cmd);
            });
            return result;
        },
        dispose: () => {},
    };
}

describe("createShibaStore", () => {
    it("reflects dispatched mutations in the reactive snapshot", async () => {
        await createRoot(async (dispose) => {
            const store = createShibaStore(fakeClient());
            expect(queries.liveWorkspaces(store.snap)).toHaveLength(0);
            await store.dispatch({
                type: "createWorkspace",
                input: { name: "W" },
            });
            expect(queries.liveWorkspaces(store.snap)).toHaveLength(1);
            dispose();
        });
    });
});
