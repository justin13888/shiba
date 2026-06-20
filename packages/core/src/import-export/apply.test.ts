import { describe, expect, it } from "vitest";
import * as ops from "../doc/ops";
import * as queries from "../doc/queries";
import { createFakeDoc, must, testDeps } from "../testing";
import { applyImport } from "./apply";

describe("applyImport", () => {
    it("materializes imported groups and tabs", () => {
        const doc = createFakeDoc();
        const deps = testDeps();
        let wsId = "";
        doc.mutate((tx) => {
            wsId = ops.createWorkspace(tx, deps, { name: "W" }).id;
        });
        let result!: ops.SaveResult;
        doc.mutate((tx) => {
            result = applyImport(
                tx,
                deps,
                [
                    {
                        name: "G1",
                        tabs: [
                            { url: "https://a.com", title: "A" },
                            { url: "https://b.com", title: "B" },
                        ],
                    },
                ],
                { workspaceId: wsId },
            );
        });
        expect(result.groupIds).toHaveLength(1);
        expect(result.tabIds).toHaveLength(2);
        expect(
            queries.liveTabs(doc.snapshot(), must(result.groupIds[0])),
        ).toHaveLength(2);
    });
});
