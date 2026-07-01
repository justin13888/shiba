import { describe, expect, it } from "vitest";
import * as ops from "../doc/ops";
import { materializeDocSnapshot } from "../doc/restore";
import { createFakeDoc, must, seqIdGen, testDeps } from "../testing";
import {
    exportShiba,
    parseShiba,
    serializeShiba,
    shibaToSnapshot,
} from "./shiba";

function seeded() {
    const doc = createFakeDoc();
    const deps = testDeps();
    let tabId = "";
    doc.mutate((tx) => {
        const ws = ops.createWorkspace(tx, deps, { name: "W" });
        const g = ops.createGroup(tx, deps, { workspaceId: ws.id, name: "G" });
        tabId = ops.createTab(tx, deps, {
            groupId: g.id,
            url: "https://a.com",
            title: "A",
        }).id;
    });
    return { doc, deps, tabId };
}

describe("shiba export/import", () => {
    it("round-trips through export/serialize/parse", () => {
        const { doc } = seeded();
        const parsed = parseShiba(
            serializeShiba(exportShiba(doc.snapshot(), 123)),
        );
        expect(parsed.format).toBe("shiba");
        expect(parsed.workspaces).toHaveLength(1);
        expect(parsed.groups).toHaveLength(1);
        expect(parsed.tabs).toHaveLength(1);
    });

    it("excludes soft-deleted records", () => {
        const { doc, deps, tabId } = seeded();
        doc.mutate((tx) =>
            ops.softDelete(tx, deps, { kind: "tab", id: tabId }),
        );
        expect(exportShiba(doc.snapshot(), 1).tabs).toHaveLength(0);
    });

    it("rejects a foreign document", () => {
        expect(() => parseShiba('{"format":"nope"}')).toThrow();
    });

    it("restores from a file round-trip via shibaToSnapshot", () => {
        const { doc } = seeded();
        const snapshot = shibaToSnapshot(
            parseShiba(serializeShiba(exportShiba(doc.snapshot(), 1))),
        );
        const target = createFakeDoc();
        const deps = testDeps({ ids: seqIdGen("dst") });
        target.mutate((tx) =>
            materializeDocSnapshot(tx, deps, snapshot, { label: "file" }),
        );
        const snap = target.snapshot();
        expect(must(Object.values(snap.workspaces)[0]).name).toBe("W (file)");
        expect(Object.values(snap.tabs)).toHaveLength(1);
    });
});
