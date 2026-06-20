import { describe, expect, it } from "vitest";
import { byOrder } from "../ordering/fractional-index";
import { must, seqIdGen } from "../testing";
import { type LegacyData, migrateV1 } from "./v1";

describe("migrateV1", () => {
    it("converts records, preserving ids and legacy order", () => {
        const data: LegacyData = {
            workspaces: [{ id: "w1", order: 0, name: "W" }],
            tabGroups: [
                {
                    id: "g1",
                    workspaceId: "w1",
                    name: "G",
                    timeCreated: 100,
                    timeModified: 200,
                },
            ],
            tabs: [
                {
                    id: "t2",
                    groupId: "g1",
                    order: 1,
                    title: "B",
                    url: "https://b",
                },
                {
                    id: "t1",
                    groupId: "g1",
                    order: 0,
                    title: "A",
                    url: "https://a",
                },
            ],
        };
        const out = migrateV1(data, { now: 1000, ids: seqIdGen() });
        expect(must(out.workspaces[0]).isDefault).toBe(true);
        expect(out.groups).toHaveLength(1);
        const tabs = [...out.tabs].sort(byOrder);
        expect(tabs.map((t) => t.id)).toEqual(["t1", "t2"]);
        expect(must(tabs[0]).order < must(tabs[1]).order).toBe(true);
    });

    it("synthesizes a default workspace when none exist", () => {
        const out = migrateV1(
            {
                workspaces: [],
                tabGroups: [{ id: "g", timeCreated: 1, timeModified: 1 }],
                tabs: [],
            },
            { now: 1, ids: seqIdGen() },
        );
        expect(out.workspaces).toHaveLength(1);
        expect(must(out.groups[0]).workspaceId).toBe(
            must(out.workspaces[0]).id,
        );
    });
});
