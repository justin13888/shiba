import {
    applyCommand,
    type Command,
    type CommandResult,
    type OpDeps,
    queries,
} from "@shiba/core";
import { testDeps } from "@shiba/core/testing";
import { yjsAdapter } from "@shiba/crdt-yjs";
import { fromBase64, toBase64 } from "@shiba/sync-protocol";
import { describe, expect, it } from "vitest";

/**
 * A stand-in for the worker's owned document + broadcast, mirroring
 * `buildWorkerRuntime`'s exact encode/subscribe mechanics: derive each delta with
 * `encodeStateSince(frontier)` and fan it out base64-encoded. (The `browser` port
 * + IndexedDB glue is covered by the Playwright E2E two-context test.)
 */
function worker() {
    const deps: OpDeps = testDeps();
    const doc = yjsAdapter.create("worker");
    const listeners = new Set<(updateB64: string) => void>();
    let frontier = doc.stateVector();
    doc.subscribe(() => {
        const delta = doc.encodeStateSince(frontier);
        if (delta.length === 0) return;
        frontier = doc.stateVector();
        const encoded = toBase64(delta);
        for (const listener of listeners) listener(encoded);
    });
    return {
        currentStateB64: () => toBase64(doc.encodeState()),
        onUpdate(fn: (updateB64: string) => void) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        dispatch(cmd: Command): CommandResult {
            let result!: CommandResult;
            doc.mutate((tx) => {
                result = applyCommand(tx, deps, cmd);
            });
            return result;
        },
    };
}

/** A page mirror, exactly as `connectBridge` builds one: hydrate then apply deltas. */
function mirror(w: ReturnType<typeof worker>) {
    const doc = yjsAdapter.load("mirror", fromBase64(w.currentStateB64()));
    const off = w.onUpdate((updateB64) =>
        doc.applyUpdate(fromBase64(updateB64), "remote"),
    );
    return { doc, dispose: off };
}

describe("bridge convergence", () => {
    it("a dispatched mutation reaches a connected mirror", () => {
        const w = worker();
        const page = mirror(w);
        expect(queries.liveWorkspaces(page.doc.snapshot())).toHaveLength(0);
        w.dispatch({ type: "createWorkspace", input: { name: "W" } });
        expect(queries.liveWorkspaces(page.doc.snapshot())).toHaveLength(1);
    });

    it("two mirrors stay in sync with the worker (two-context reactivity)", () => {
        const w = worker();
        const a = mirror(w);
        const b = mirror(w);
        const { ids } = w.dispatch({
            type: "createWorkspace",
            input: { name: "Shared" },
        });
        w.dispatch({
            type: "saveBrowserTabs",
            tabs: [{ title: "T", url: "https://x.com", windowId: 1 }],
            options: { workspaceId: ids[0] ?? "" },
        });
        for (const page of [a, b]) {
            const snap = page.doc.snapshot();
            const ws = queries.liveWorkspaces(snap);
            expect(ws).toHaveLength(1);
            expect(
                queries.liveGroups(snap, ws[0]?.id ?? "", null),
            ).toHaveLength(1);
        }
    });

    it("a late-joining mirror hydrates current state, then stays live", () => {
        const w = worker();
        w.dispatch({ type: "createWorkspace", input: { name: "Early" } });
        // Connects only after the first edit: must see it via the init snapshot.
        const late = mirror(w);
        expect(queries.liveWorkspaces(late.doc.snapshot())).toHaveLength(1);
        w.dispatch({ type: "createWorkspace", input: { name: "Later" } });
        expect(queries.liveWorkspaces(late.doc.snapshot())).toHaveLength(2);
    });
});
