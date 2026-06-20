import { describe, expect, it } from "vitest";
import { createFakeDoc, manualClock, must, seqIdGen } from "../testing";
import * as ops from "./ops";
import * as queries from "./queries";
import { type ReconcileReport, reconcile } from "./reconcile";

function seeded() {
    const doc = createFakeDoc();
    const clock = manualClock(1000);
    const deps = { clock, ids: seqIdGen() };
    let wsId = "";
    doc.mutate((tx) => {
        wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
    });
    return { doc, deps, clock, wsId };
}

describe("reconcile", () => {
    it("purges tombstones older than the TTL", () => {
        const { doc, deps, clock, wsId } = seeded();
        let gid = "";
        doc.mutate((tx) => {
            gid = ops.createGroup(tx, deps, { workspaceId: wsId }).id;
        });
        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "group", id: gid }),
        );
        clock.advance(10_000);
        let report!: ReconcileReport;
        doc.mutate((tx) => {
            report = reconcile(tx, deps, { tombstoneTtlMs: 5000 });
        });
        expect(report.purged).toBeGreaterThan(0);
        expect(doc.snapshot().groups[gid]).toBeUndefined();
    });

    it("reparents orphaned tabs into a recovery group", () => {
        const { doc, deps, wsId } = seeded();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(
                tx,
                deps,
                [{ title: "A", url: "https://a.com" }],
                {
                    workspaceId: wsId,
                },
            );
        });
        const gid = must(result.groupIds[0]);
        doc.mutate((tx) => tx.groups.delete(gid)); // hard-orphan the tab
        let report!: ReconcileReport;
        doc.mutate((tx) => {
            report = reconcile(tx, deps);
        });
        expect(report.reparented).toBeGreaterThan(0);
        const tab = must(doc.snapshot().tabs[must(result.tabIds[0])]);
        expect(must(doc.snapshot().groups[tab.groupId]).name).toBe(
            "Recovered tabs",
        );
    });

    it("breaks folder parent cycles", () => {
        const { doc, deps, wsId } = seeded();
        let a = "";
        let b = "";
        doc.mutate((tx) => {
            a = ops.createFolder(tx, deps, { workspaceId: wsId, name: "A" }).id;
            b = ops.createFolder(tx, deps, { workspaceId: wsId, name: "B" }).id;
        });
        doc.mutate((tx) => {
            tx.folders.patch(a, { parentId: b });
            tx.folders.patch(b, { parentId: a });
        });
        let report!: ReconcileReport;
        doc.mutate((tx) => {
            report = reconcile(tx, deps);
        });
        expect(report.cyclesBroken).toBeGreaterThan(0);
        const snap = doc.snapshot();
        expect(
            must(snap.folders[a]).parentId === null ||
                must(snap.folders[b]).parentId === null,
        ).toBe(true);
    });

    it("repairs duplicate order keys among siblings", () => {
        const { doc, deps, wsId } = seeded();
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = ops.saveBrowserTabs(
                tx,
                deps,
                [
                    { title: "A", url: "https://a.com" },
                    { title: "B", url: "https://b.com" },
                ],
                { workspaceId: wsId },
            );
        });
        const gid = must(result.groupIds[0]);
        doc.mutate((tx) => {
            tx.tabs.patch(must(result.tabIds[0]), { order: "z" });
            tx.tabs.patch(must(result.tabIds[1]), { order: "z" });
        });
        let report!: ReconcileReport;
        doc.mutate((tx) => {
            report = reconcile(tx, deps);
        });
        expect(report.orderRepaired).toBeGreaterThan(0);
        const orders = queries
            .liveTabs(doc.snapshot(), gid)
            .map((t) => t.order);
        expect(new Set(orders).size).toBe(orders.length);
    });
});
