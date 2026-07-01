import { describe, expect, it } from "vitest";
import { createFakeDoc, must, seqIdGen, testDeps } from "../testing";
import * as ops from "./ops";
import { materializeDocSnapshot } from "./restore";

/** A source document: workspace → folder → group → tagged tab, plus a deleted group. */
function sourceSnapshot() {
    const doc = createFakeDoc();
    const deps = testDeps({ ids: seqIdGen("src") });
    doc.mutate((tx) => {
        const ws = ops.createWorkspace(tx, deps, { name: "W" });
        tx.workspaces.patch(ws.id, { isDefault: true });
        const folder = ops.createFolder(tx, deps, {
            workspaceId: ws.id,
            name: "F",
        });
        const group = ops.createGroup(tx, deps, {
            workspaceId: ws.id,
            parentId: folder.id,
            name: "G",
        });
        const tag = ops.createTag(tx, deps, { name: "read" });
        const tab = ops.createTab(tx, deps, {
            groupId: group.id,
            url: "https://x.com",
            title: "X",
        });
        ops.setTag(tx, deps, tab.id, tag.id, true);
        const dead = ops.createGroup(tx, deps, {
            workspaceId: ws.id,
            name: "dead",
        });
        ops.softDelete(tx, deps, { kind: "group", id: dead.id });
    });
    return doc.snapshot();
}

const liveValues = <T extends { deletedAt: number | null }>(
    records: Readonly<Record<string, T>>,
): T[] => Object.values(records).filter((r) => r.deletedAt === null);

describe("materializeDocSnapshot (restore as a copy)", () => {
    it("recreates the live tree with fresh ids, remapped refs, and a label", () => {
        const snapshot = sourceSnapshot();
        const target = createFakeDoc();
        const deps = testDeps({ ids: seqIdGen("dst") });
        let workspaceIds: string[] = [];
        target.mutate((tx) => {
            workspaceIds = materializeDocSnapshot(tx, deps, snapshot, {
                label: "backup",
            }).workspaceIds;
        });
        const snap = target.snapshot();

        const workspaces = liveValues(snap.workspaces);
        expect(workspaces).toHaveLength(1);
        const ws = must(workspaces[0]);
        expect(ws.name).toBe("W (backup)");
        expect(ws.isDefault).toBe(false);
        expect(ws.id.startsWith("dst")).toBe(true);
        expect(workspaceIds).toEqual([ws.id]);

        const folder = must(liveValues(snap.folders)[0]);
        expect(folder.workspaceId).toBe(ws.id);

        const groups = liveValues(snap.groups);
        expect(groups).toHaveLength(1); // the deleted "dead" group is excluded
        const group = must(groups[0]);
        expect(group.workspaceId).toBe(ws.id);
        expect(group.parentId).toBe(folder.id);

        const tab = must(liveValues(snap.tabs)[0]);
        expect(tab.groupId).toBe(group.id);
        const tag = must(liveValues(snap.tags)[0]);
        expect(tab.tagIds).toEqual([tag.id]);
    });

    it("without a label, workspace names are unchanged", () => {
        const snapshot = sourceSnapshot();
        const target = createFakeDoc();
        const deps = testDeps({ ids: seqIdGen("dst") });
        target.mutate((tx) => materializeDocSnapshot(tx, deps, snapshot));
        expect(must(liveValues(target.snapshot().workspaces)[0]).name).toBe(
            "W",
        );
    });
});
