import { describe, expect, it } from "vitest";
import * as ops from "../doc/ops";
import { createFakeDoc, testDeps } from "../testing";
import { exportShiba, parseShiba, serializeShiba } from "./shiba";

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
});
