import { describe, expect, it } from "vitest";
import { createFakeDoc, must, testDeps } from "../testing";
import * as ops from "./ops";
import * as queries from "./queries";

describe("queries", () => {
    it("defaultWorkspace prefers the flagged default, else the first", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let secondId = "";
        doc.mutate((tx) => {
            ops.createWorkspace(tx, deps, { name: "First" });
            const w = ops.createWorkspace(tx, deps, { name: "Second" });
            secondId = w.id;
            tx.workspaces.patch(w.id, { isDefault: true });
        });
        expect(must(queries.defaultWorkspace(doc.snapshot())).id).toBe(
            secondId,
        );
    });

    it("orders groups pinned-first then by order; excludes deleted and archived", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let wsId = "";
        const gids: string[] = [];
        doc.mutate((tx) => {
            wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
            for (const n of ["g0", "g1", "g2"]) {
                gids.push(
                    ops.createGroup(tx, deps, { workspaceId: wsId, name: n })
                        .id,
                );
            }
        });
        doc.mutate((tx) => {
            ops.setPinned(tx, deps, { kind: "group", id: must(gids[2]) }, true);
            ops.softDelete(tx, deps, { kind: "group", id: must(gids[0]) });
        });
        const groups = queries.liveGroups(doc.snapshot(), wsId, null);
        expect(groups.map((g) => g.id)).toEqual([gids[2], gids[1]]);
    });

    it("tabsByTag returns only live tabs carrying the tag", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let tagId = "";
        let taggedId = "";
        doc.mutate((tx) => {
            const wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
            const gid = ops.createGroup(tx, deps, { workspaceId: wsId }).id;
            tagId = ops.createTag(tx, deps, { name: "t" }).id;
            taggedId = ops.createTab(tx, deps, {
                groupId: gid,
                url: "https://a.com",
                title: "A",
            }).id;
            ops.createTab(tx, deps, {
                groupId: gid,
                url: "https://b.com",
                title: "B",
            });
            ops.setTag(tx, deps, taggedId, tagId, true);
        });
        const tabs = queries.tabsByTag(doc.snapshot(), tagId);
        expect(tabs.map((t) => t.id)).toEqual([taggedId]);
    });
});
