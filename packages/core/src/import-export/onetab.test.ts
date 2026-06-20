import { describe, expect, it } from "vitest";
import { must } from "../testing";
import { parseOneTab, toOneTab } from "./onetab";

describe("parseOneTab", () => {
    it("splits groups on blank lines and keeps first-pipe titles", () => {
        const text =
            "https://a.com/1 | Title A\nhttps://a.com/2 | T | with pipe\n\nhttps://b.com | C";
        const data = parseOneTab(text);
        expect(data).toHaveLength(2);
        expect(must(data[0]).tabs).toHaveLength(2);
        expect(must(must(data[0]).tabs[1]).title).toBe("T | with pipe");
        expect(must(must(data[1]).tabs[0])).toEqual({
            url: "https://b.com",
            title: "C",
        });
    });

    it("treats a pipe-less line as a bare url", () => {
        const data = parseOneTab("https://x.com");
        expect(must(must(data[0]).tabs[0])).toEqual({
            url: "https://x.com",
            title: "https://x.com",
        });
    });

    it("round-trips through toOneTab", () => {
        const data = parseOneTab("https://a.com | A\nhttps://b.com | B");
        expect(parseOneTab(toOneTab(data))).toEqual(data);
    });
});
