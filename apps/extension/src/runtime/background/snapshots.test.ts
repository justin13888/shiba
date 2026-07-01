import {
    ops,
    queries,
    type Snapshot,
    type SnapshotMeta,
    type SnapshotStore,
} from "@shiba/core";
import { must, seqIdGen, testDeps } from "@shiba/core/testing";
import { yjsAdapter } from "@shiba/crdt-yjs";
import { describe, expect, it } from "vitest";
import { exportBackup, importBackup, restoreSnapshotById } from "./backup";
import type { WorkerRuntime } from "./runtime";
import { runRetention } from "./snapshots";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// A realistic wall-clock base so the hourly cadence (now - 0 >= HOUR) is "due".
const T = 1_700_000_000_000;

/** In-memory SnapshotStore mirroring the IDB adapter's split meta/blob storage. */
function memStore(): SnapshotStore {
    const metas = new Map<string, SnapshotMeta>();
    const states = new Map<string, Uint8Array>();
    return {
        async put(s: Snapshot) {
            const { state, ...meta } = s;
            metas.set(s.id, meta);
            states.set(s.id, state);
        },
        async get(id) {
            const meta = metas.get(id);
            const state = states.get(id);
            return meta && state ? { ...meta, state } : undefined;
        },
        async list() {
            return [...metas.values()].sort(
                (a, b) => b.createdAt - a.createdAt,
            );
        },
        async delete(id) {
            metas.delete(id);
            states.delete(id);
        },
    };
}

/** A WorkerRuntime backed by a real Yjs doc + in-memory store (no browser/IDB). */
function fakeRuntime(): WorkerRuntime {
    return {
        deviceId: "dev",
        doc: yjsAdapter.create("dev"),
        deps: testDeps({ ids: seqIdGen("s") }),
        snapshots: memStore(),
        dispatch: () => ({ ids: [] }),
        onUpdate: () => () => {},
        currentStateB64: () => "",
        compact: async () => {},
    };
}

const seedWorkspace = (rt: WorkerRuntime, name = "W"): void => {
    rt.doc.mutate((tx) => ops.createWorkspace(tx, rt.deps, { name }));
};

describe("runRetention", () => {
    it("captures a changed document and records live counts", async () => {
        const rt = fakeRuntime();
        rt.doc.mutate((tx) => {
            const ws = ops.createWorkspace(tx, rt.deps, { name: "W" });
            ops.createGroup(tx, rt.deps, { workspaceId: ws.id, name: "G" });
        });
        expect(await runRetention(rt, T)).toBe(true);
        const list = await rt.snapshots.list();
        expect(list).toHaveLength(1);
        expect(must(list[0]).groupCount).toBe(1);
    });

    it("skips when the cadence is due but nothing changed", async () => {
        const rt = fakeRuntime();
        seedWorkspace(rt);
        await runRetention(rt, T);
        expect(await runRetention(rt, T + 2 * HOUR)).toBe(false);
        expect(await rt.snapshots.list()).toHaveLength(1);
    });

    it("captures again once the document changes", async () => {
        const rt = fakeRuntime();
        seedWorkspace(rt);
        await runRetention(rt, T);
        seedWorkspace(rt, "W2");
        expect(await runRetention(rt, T + 2 * HOUR)).toBe(true);
        expect(await rt.snapshots.list()).toHaveLength(2);
    });

    it("force captures mid-cadence when changed", async () => {
        const rt = fakeRuntime();
        seedWorkspace(rt);
        await runRetention(rt, T);
        seedWorkspace(rt, "W2");
        // cadence NOT due (1s later), but forced + changed
        expect(await runRetention(rt, T + 1000, { force: true })).toBe(true);
        expect(await rt.snapshots.list()).toHaveLength(2);
    });

    it("evicts snapshots past the one-week window", async () => {
        const rt = fakeRuntime();
        seedWorkspace(rt);
        await rt.snapshots.put({
            id: "old",
            createdAt: T - 8 * DAY,
            deviceId: "dev",
            triggers: ["hourly"],
            tabCount: 0,
            groupCount: 0,
            stateHash: "x",
            state: new Uint8Array([1]),
        });
        await runRetention(rt, T);
        expect((await rt.snapshots.list()).map((s) => s.id)).not.toContain(
            "old",
        );
    });
});

describe("restore + file round-trip", () => {
    const seedTree = (rt: WorkerRuntime): void => {
        rt.doc.mutate((tx) => {
            const ws = ops.createWorkspace(tx, rt.deps, { name: "Original" });
            const g = ops.createGroup(tx, rt.deps, {
                workspaceId: ws.id,
                name: "G",
            });
            ops.createTab(tx, rt.deps, {
                groupId: g.id,
                url: "https://x.com",
                title: "X",
            });
        });
    };

    it("restores a snapshot as a new labelled workspace (additive)", async () => {
        const rt = fakeRuntime();
        seedTree(rt);
        await runRetention(rt, T, { force: true });
        const meta = must((await rt.snapshots.list())[0]);
        const snapshot = must(await rt.snapshots.get(meta.id));

        const result = restoreSnapshotById(rt, snapshot.state, meta.createdAt);
        expect(result.workspaceIds).toHaveLength(1);
        const names = queries
            .liveWorkspaces(rt.doc.snapshot())
            .map((w) => w.name);
        expect(names).toContain("Original"); // original untouched
        expect(names.some((n) => n.startsWith("Original (restored"))).toBe(
            true,
        );
    });

    it("exports then imports into a fresh document", () => {
        const source = fakeRuntime();
        seedTree(source);
        const json = exportBackup(source, T);

        const target = fakeRuntime();
        const result = importBackup(target, json, T + 1000);
        expect(result.workspaceIds).toHaveLength(1);
        const snap = target.doc.snapshot();
        expect(must(queries.liveWorkspaces(snap)[0]).name).toContain(
            "(imported",
        );
        expect(Object.keys(snap.tabs)).toHaveLength(1);
    });

    it("rejects a malformed import file", () => {
        expect(() => importBackup(fakeRuntime(), "{}", 1)).toThrow();
    });
});
