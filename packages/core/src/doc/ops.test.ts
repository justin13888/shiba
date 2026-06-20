import { describe, expect, it } from "vitest";
import type { BrowserTab } from "../ports/tabs";
import { createFakeDoc, must, recordingSink, testDeps } from "../testing";
import * as ops from "./ops";
import * as queries from "./queries";

const TABS: BrowserTab[] = [
    { title: "A", url: "https://a.com/1", windowId: 1 },
    { title: "B", url: "https://b.com/2", windowId: 1 },
    { title: "C", url: "https://a.com/3", windowId: 2 },
];

function workspace() {
    const doc = createFakeDoc();
    const deps = testDeps();
    let wsId = "";
    doc.mutate((tx) => {
        wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
    });
    return { doc, deps, wsId };
}

describe("ops creation + ordering", () => {
    it("appends siblings in creation order", () => {
        const { doc, deps, wsId } = workspace();
        const ids: string[] = [];
        doc.mutate((tx) => {
            ids.push(ops.createGroup(tx, deps, { workspaceId: wsId }).id);
            ids.push(ops.createGroup(tx, deps, { workspaceId: wsId }).id);
        });
        expect(
            queries.liveGroups(doc.snapshot(), wsId, null).map((g) => g.id),
        ).toEqual(ids);
    });
});

describe("ops.saveBrowserTabs", () => {
    it("single strategy creates one group with all tabs, in order", () => {
        const { doc, deps, wsId } = workspace();
        const sink = recordingSink();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(
                tx,
                { ...deps, analytics: sink },
                TABS,
                {
                    workspaceId: wsId,
                },
            );
        });
        expect(result.groupIds).toHaveLength(1);
        const gid = must(result.groupIds[0]);
        expect(
            queries.liveTabs(doc.snapshot(), gid).map((t) => t.title),
        ).toEqual(["A", "B", "C"]);
        expect(sink.events).toContainEqual(
            expect.objectContaining({ type: "tab_saved", count: 3 }),
        );
    });

    it("byWindow splits into one group per window", () => {
        const { doc, deps, wsId } = workspace();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(tx, deps, TABS, {
                workspaceId: wsId,
                strategy: "byWindow",
            });
        });
        expect(result.groupIds).toHaveLength(2);
    });

    it("byDomain splits into one group per host", () => {
        const { doc, deps, wsId } = workspace();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(tx, deps, TABS, {
                workspaceId: wsId,
                strategy: "byDomain",
            });
        });
        expect(result.groupIds).toHaveLength(2); // a.com + b.com
    });
});

describe("ops movement", () => {
    function savedGroup() {
        const { doc, deps, wsId } = workspace();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(tx, deps, TABS, { workspaceId: wsId });
        });
        return {
            doc,
            deps,
            wsId,
            gid: must(result.groupIds[0]),
            tabIds: result.tabIds,
        };
    }

    it("moveTab reorders within a group", () => {
        const { doc, deps, gid, tabIds } = savedGroup();
        doc.mutate((tx) =>
            ops.moveTab(tx, deps, must(tabIds[2]), {
                groupId: gid,
                before: must(tabIds[0]),
            }),
        );
        expect(queries.liveTabs(doc.snapshot(), gid).map((t) => t.id)[0]).toBe(
            tabIds[2],
        );
    });

    it("moveTab to another group reparents it", () => {
        const { doc, deps, wsId, gid, tabIds } = savedGroup();
        let otherId = "";
        doc.mutate((tx) => {
            otherId = ops.createGroup(tx, deps, { workspaceId: wsId }).id;
        });
        doc.mutate((tx) =>
            ops.moveTab(tx, deps, must(tabIds[0]), { groupId: otherId }),
        );
        expect(
            queries.liveTabs(doc.snapshot(), otherId).map((t) => t.id),
        ).toContain(tabIds[0]);
        expect(
            queries.liveTabs(doc.snapshot(), gid).map((t) => t.id),
        ).not.toContain(tabIds[0]);
    });

    it("moveFolder refuses to create a cycle", () => {
        const { doc, deps, wsId } = workspace();
        let a = "";
        let b = "";
        doc.mutate((tx) => {
            a = ops.createFolder(tx, deps, { workspaceId: wsId, name: "A" }).id;
            b = ops.createFolder(tx, deps, {
                workspaceId: wsId,
                parentId: a,
                name: "B",
            }).id;
        });
        doc.mutate((tx) =>
            ops.moveFolder(tx, deps, a, { workspaceId: wsId, parentId: b }),
        );
        expect(must(doc.snapshot().folders[a]).parentId).toBeNull();
    });
});

describe("ops lifecycle", () => {
    it("softDelete on a group cascades to tabs and restore reverses it", () => {
        const { doc, deps, wsId } = workspace();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(tx, deps, TABS, { workspaceId: wsId });
        });
        const gid = must(result.groupIds[0]);

        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "group", id: gid }),
        );
        expect(queries.liveGroups(doc.snapshot(), wsId, null)).toHaveLength(0);
        expect(queries.liveTabs(doc.snapshot(), gid)).toHaveLength(0);
        expect(queries.trashed(doc.snapshot()).tabs).toHaveLength(3);

        doc.mutate((tx) => ops.restore(tx, deps, { kind: "group", id: gid }));
        expect(queries.liveTabs(doc.snapshot(), gid)).toHaveLength(3);
    });

    it("softDelete on a workspace cascades to folders, groups, and tabs", () => {
        const { doc, deps, wsId } = workspace();
        doc.mutate((tx) => {
            const f = ops.createFolder(tx, deps, {
                workspaceId: wsId,
                name: "F",
            });
            const g = ops.createGroup(tx, deps, {
                workspaceId: wsId,
                parentId: f.id,
            });
            ops.createTab(tx, deps, {
                groupId: g.id,
                url: "https://x.com",
                title: "X",
            });
        });
        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "workspace", id: wsId }),
        );
        const trash = queries.trashed(doc.snapshot());
        expect(trash.workspaces).toHaveLength(1);
        expect(trash.folders).toHaveLength(1);
        expect(trash.groups).toHaveLength(1);
        expect(trash.tabs).toHaveLength(1);
    });
});

describe("ops attributes", () => {
    it("pins, locks, archives, renames, and tags", () => {
        const { doc, deps, wsId } = workspace();
        let gid = "";
        let tabId = "";
        let tagId = "";
        doc.mutate((tx) => {
            gid = ops.createGroup(tx, deps, {
                workspaceId: wsId,
                name: "G",
            }).id;
            tabId = ops.createTab(tx, deps, {
                groupId: gid,
                url: "https://x.com",
                title: "X",
            }).id;
            tagId = ops.createTag(tx, deps, { name: "read-later" }).id;
        });
        doc.mutate((tx) => {
            ops.setPinned(tx, deps, { kind: "group", id: gid }, true);
            ops.setLocked(tx, deps, gid, true);
            ops.setArchived(tx, deps, gid, true);
            ops.rename(tx, deps, { kind: "tab", id: tabId }, "Renamed");
            ops.setTag(tx, deps, tabId, tagId, true);
        });
        const snap = doc.snapshot();
        const group = must(snap.groups[gid]);
        expect(group.pinned).toBe(true);
        expect(group.locked).toBe(true);
        expect(group.archivedAt).not.toBeNull();
        const tab = must(snap.tabs[tabId]);
        expect(tab.title).toBe("Renamed");
        expect(tab.tagIds).toContain(tagId);
        // archived groups leave the main view but appear under archived
        expect(queries.liveGroups(snap, wsId, null)).toHaveLength(0);
        expect(queries.archivedGroups(snap, wsId)).toHaveLength(1);
    });
});
