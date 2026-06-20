import { ops, queries } from "@shiba/core";
import { createFakeDoc, testDeps } from "@shiba/core/testing";
import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import type { Runtime } from "../runtime/container";
import { createShibaStore } from "./store";

function fakeRuntime(): Runtime {
    const doc = createFakeDoc();
    return {
        doc,
        deps: testDeps(),
        commit: (fn) => {
            doc.mutate(fn);
        },
    };
}

describe("createShibaStore", () => {
    it("reflects committed mutations in the reactive snapshot", () => {
        createRoot((dispose) => {
            const store = createShibaStore(fakeRuntime());
            expect(queries.liveWorkspaces(store.snap)).toHaveLength(0);
            store.commit((tx) =>
                ops.createWorkspace(tx, store.deps, { name: "W" }),
            );
            expect(queries.liveWorkspaces(store.snap)).toHaveLength(1);
            dispose();
        });
    });
});
