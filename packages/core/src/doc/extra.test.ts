import { describe, expect, it } from "vitest";
import { createFakeDoc, must, testDeps } from "../testing";
import * as ops from "./ops";
import * as queries from "./queries";

describe("ops coverage", () => {
    it("moveGroup reorders and reparents into a folder", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let wsId = "";
        let folderId = "";
        const groupIds: string[] = [];
        doc.mutate((tx) => {
            wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
            folderId = ops.createFolder(tx, deps, {
                workspaceId: wsId,
                name: "F",
            }).id;
            groupIds.push(ops.createGroup(tx, deps, { workspaceId: wsId }).id);
            groupIds.push(ops.createGroup(tx, deps, { workspaceId: wsId }).id);
        });
        doc.mutate((tx) =>
            ops.moveGroup(tx, deps, must(groupIds[1]), {
                workspaceId: wsId,
                parentId: folderId,
                before: undefined,
            }),
        );
        expect(
            queries.liveGroups(doc.snapshot(), wsId, null).map((g) => g.id),
        ).toEqual([groupIds[0]]);
        expect(
            queries.liveGroups(doc.snapshot(), wsId, folderId).map((g) => g.id),
        ).toEqual([groupIds[1]]);
    });

    it("renames every entity kind and sets notes", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        const ids = { ws: "", folder: "", group: "", tab: "", tag: "" };
        doc.mutate((tx) => {
            ids.ws = ops.createWorkspace(tx, deps, { name: "W" }).id;
            ids.folder = ops.createFolder(tx, deps, {
                workspaceId: ids.ws,
                name: "F",
            }).id;
            ids.group = ops.createGroup(tx, deps, { workspaceId: ids.ws }).id;
            ids.tab = ops.createTab(tx, deps, {
                groupId: ids.group,
                url: "https://x.com",
                title: "X",
            }).id;
            ids.tag = ops.createTag(tx, deps, { name: "t" }).id;
        });
        doc.mutate((tx) => {
            ops.rename(tx, deps, { kind: "workspace", id: ids.ws }, "W2");
            ops.rename(tx, deps, { kind: "folder", id: ids.folder }, "F2");
            ops.rename(tx, deps, { kind: "group", id: ids.group }, "G2");
            ops.rename(tx, deps, { kind: "tag", id: ids.tag }, "t2");
            ops.setNotes(tx, deps, ids.tab, "a note");
        });
        const snap = doc.snapshot();
        expect(must(snap.workspaces[ids.ws]).name).toBe("W2");
        expect(must(snap.folders[ids.folder]).name).toBe("F2");
        expect(must(snap.groups[ids.group]).name).toBe("G2");
        expect(must(snap.tags[ids.tag]).name).toBe("t2");
        expect(must(snap.tabs[ids.tab]).notes).toBe("a note");
    });

    it("soft-deletes and restores a folder subtree", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let wsId = "";
        let folderId = "";
        let groupId = "";
        doc.mutate((tx) => {
            wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
            folderId = ops.createFolder(tx, deps, {
                workspaceId: wsId,
                name: "F",
            }).id;
            groupId = ops.createGroup(tx, deps, {
                workspaceId: wsId,
                parentId: folderId,
            }).id;
            ops.createTab(tx, deps, {
                groupId,
                url: "https://x.com",
                title: "X",
            });
        });
        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "folder", id: folderId }),
        );
        expect(queries.trashed(doc.snapshot()).tabs).toHaveLength(1);
        expect(queries.liveFolders(doc.snapshot(), wsId, null)).toHaveLength(0);

        doc.mutate((tx) =>
            ops.restore(tx, deps, { kind: "folder", id: folderId }),
        );
        expect(queries.liveFolders(doc.snapshot(), wsId, null)).toHaveLength(1);
        expect(queries.liveTabs(doc.snapshot(), groupId)).toHaveLength(1);
    });
});

describe("queries coverage", () => {
    it("returns undefined for the default workspace when empty", () => {
        expect(
            queries.defaultWorkspace(createFakeDoc().snapshot()),
        ).toBeUndefined();
    });

    it("counts live tabs per group", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let groupId = "";
        let tabId = "";
        doc.mutate((tx) => {
            const ws = ops.createWorkspace(tx, deps, { name: "W" });
            groupId = ops.createGroup(tx, deps, { workspaceId: ws.id }).id;
            tabId = ops.createTab(tx, deps, {
                groupId,
                url: "https://a.com",
                title: "A",
            }).id;
            ops.createTab(tx, deps, {
                groupId,
                url: "https://b.com",
                title: "B",
            });
        });
        expect(queries.groupTabCount(doc.snapshot(), groupId)).toBe(2);
        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "tab", id: tabId }),
        );
        expect(queries.groupTabCount(doc.snapshot(), groupId)).toBe(1);
    });
});
