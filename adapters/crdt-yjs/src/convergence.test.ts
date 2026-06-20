import { type CrdtDocument, type DocSnapshot, ops, queries } from "@shiba/core";
import { seqIdGen, testDeps } from "@shiba/core/testing";
import { describe, expect, it } from "vitest";
import { yjsAdapter } from "./index";

const depsA = testDeps({ ids: seqIdGen("a") });
const depsB = testDeps({ ids: seqIdGen("b") });

/** One bidirectional delta exchange — enough for two peers to converge. */
function sync(a: CrdtDocument, b: CrdtDocument): void {
    b.applyUpdate(a.encodeStateSince(b.stateVector()));
    a.applyUpdate(b.encodeStateSince(a.stateVector()));
}

/** Canonicalize for comparison: tag sets have no inherent order. */
function canon(doc: CrdtDocument): DocSnapshot {
    const s = doc.snapshot();
    const tabs = Object.fromEntries(
        Object.entries(s.tabs).map(([id, t]) => [
            id,
            { ...t, tagIds: [...t.tagIds].sort() },
        ]),
    );
    return { ...s, tabs };
}

/** A fresh pair of peers sharing the same base document (one workspace + group). */
function peers() {
    const a = yjsAdapter.create("A");
    let wsId = "";
    let groupId = "";
    a.mutate((tx) => {
        wsId = ops.createWorkspace(tx, depsA, { name: "W" }).id;
        groupId = ops.createGroup(tx, depsA, { workspaceId: wsId }).id;
    });
    const b = yjsAdapter.load("B", a.encodeState());
    return { a, b, wsId, groupId };
}

describe("yjs adapter basics", () => {
    it("round-trips a snapshot and reports schema version", () => {
        const doc = yjsAdapter.create("A");
        doc.mutate((tx) => ops.createWorkspace(tx, depsA, { name: "Home" }));
        expect(doc.snapshot().schemaVersion).toBe(2);
        expect(queries.liveWorkspaces(doc.snapshot())).toHaveLength(1);
    });

    it("notifies subscribers with the change origin", () => {
        const doc = yjsAdapter.create("A");
        const origins: string[] = [];
        doc.subscribe((c) => origins.push(c.origin));
        doc.mutate((tx) => ops.createWorkspace(tx, depsA, { name: "W" }));
        expect(origins).toContain("local");
    });
});

describe("yjs convergence", () => {
    it("merges disjoint edits", () => {
        const { a, b, groupId } = peers();
        a.mutate((tx) =>
            ops.createTab(tx, depsA, {
                groupId,
                url: "https://a.com",
                title: "A",
            }),
        );
        b.mutate((tx) =>
            ops.createTab(tx, depsB, {
                groupId,
                url: "https://b.com",
                title: "B",
            }),
        );
        sync(a, b);
        expect(canon(a)).toEqual(canon(b));
        expect(queries.liveTabs(a.snapshot(), groupId)).toHaveLength(2);
    });

    it("resolves a concurrent same-slot insert deterministically", () => {
        const { a, b, groupId } = peers();
        a.mutate((tx) =>
            ops.createTab(tx, depsA, { groupId, url: "https://x", title: "X" }),
        );
        b.mutate((tx) =>
            ops.createTab(tx, depsB, { groupId, url: "https://y", title: "Y" }),
        );
        sync(a, b);
        expect(canon(a)).toEqual(canon(b));
        const orderA = queries.liveTabs(a.snapshot(), groupId).map((t) => t.id);
        const orderB = queries.liveTabs(b.snapshot(), groupId).map((t) => t.id);
        expect(orderA).toEqual(orderB);
    });

    it("merges concurrent tag additions without loss", () => {
        const { a, b, groupId } = peers();
        let tabId = "";
        a.mutate((tx) => {
            tabId = ops.createTab(tx, depsA, {
                groupId,
                url: "https://a.com",
                title: "A",
            }).id;
        });
        b.applyUpdate(a.encodeStateSince(b.stateVector()));
        let tag1 = "";
        let tag2 = "";
        a.mutate((tx) => {
            tag1 = ops.createTag(tx, depsA, { name: "one" }).id;
            ops.setTag(tx, depsA, tabId, tag1, true);
        });
        b.mutate((tx) => {
            tag2 = ops.createTag(tx, depsB, { name: "two" }).id;
            ops.setTag(tx, depsB, tabId, tag2, true);
        });
        sync(a, b);
        expect(canon(a)).toEqual(canon(b));
        const tab = a.snapshot().tabs[tabId];
        expect(tab?.tagIds.toSorted()).toEqual([tag1, tag2].toSorted());
    });

    it("keeps both sides of a concurrent delete-vs-edit (field-level merge)", () => {
        const { a, b, groupId } = peers();
        let tabId = "";
        a.mutate((tx) => {
            tabId = ops.createTab(tx, depsA, {
                groupId,
                url: "https://a.com",
                title: "A",
            }).id;
        });
        b.applyUpdate(a.encodeStateSince(b.stateVector()));
        a.mutate((tx) => ops.softDelete(tx, depsA, { kind: "tab", id: tabId }));
        b.mutate((tx) =>
            ops.rename(tx, depsB, { kind: "tab", id: tabId }, "Renamed"),
        );
        sync(a, b);
        expect(canon(a)).toEqual(canon(b));
        const tab = a.snapshot().tabs[tabId];
        expect(tab?.deletedAt).not.toBeNull();
        expect(tab?.title).toBe("Renamed");
    });
});
