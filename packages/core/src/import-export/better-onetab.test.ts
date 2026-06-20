import { describe, expect, it } from "vitest";
import { must } from "../testing";
import { parseBetterOneTab } from "./better-onetab";

describe("parseBetterOneTab", () => {
    it("parses lists and skips malformed entries", () => {
        const json = JSON.stringify([
            {
                title: "L1",
                tabs: [
                    { url: "https://a.com", title: "A" },
                    { url: "" },
                    { x: 1 },
                ],
            },
            { tabs: [{ url: "https://b.com" }] },
            { tabs: "bad" },
            null,
        ]);
        const data = parseBetterOneTab(json);
        expect(data).toHaveLength(2);
        expect(must(data[0]).name).toBe("L1");
        expect(must(data[0]).tabs).toHaveLength(1);
        expect(must(must(data[1]).tabs[0]).title).toBe("https://b.com");
    });

    it("throws when the top level is not an array", () => {
        expect(() => parseBetterOneTab("{}")).toThrow();
    });
});
