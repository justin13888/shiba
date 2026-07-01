import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the WebExtension API surface the adapter touches. `vi.hoisted` lets the
// hoisted `vi.mock` factory reference these spies safely.
const { query, remove, getURL } = vi.hoisted(() => ({
    query: vi.fn(),
    remove: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://shiba${path}`),
}));

vi.mock("wxt/browser", () => ({
    browser: {
        runtime: { getURL },
        tabs: { query, remove },
    },
}));

import { closeTabs, savableCurrentWindow } from "./tabs";

beforeEach(() => {
    query.mockReset();
    remove.mockReset();
});

describe("savableCurrentWindow", () => {
    it("queries non-pinned current-window tabs and excludes the Shiba app page", async () => {
        query.mockResolvedValue([
            { id: 1, title: "A", url: "https://a.example", windowId: 5 },
            {
                id: 2,
                title: "Shiba",
                url: "chrome-extension://shiba/index.html",
                windowId: 5,
            },
            { id: 3, title: "B", url: "https://b.example", windowId: 5 },
        ]);

        const tabs = await savableCurrentWindow();

        expect(query).toHaveBeenCalledWith({
            currentWindow: true,
            pinned: false,
        });
        expect(tabs.map((t) => t.id)).toEqual([1, 3]);
    });

    it("drops tabs missing a url or title", async () => {
        query.mockResolvedValue([
            { id: 1, title: "A", url: "https://a.example" },
            { id: 2, url: "https://no-title.example" },
            { id: 3, title: "No URL" },
        ]);

        const tabs = await savableCurrentWindow();

        expect(tabs.map((t) => t.id)).toEqual([1]);
    });
});

describe("closeTabs", () => {
    it("removes the tabs' ids", async () => {
        await closeTabs([
            { id: 1, title: "A", url: "https://a" },
            { id: 2, title: "B", url: "https://b" },
        ]);

        expect(remove).toHaveBeenCalledWith([1, 2]);
    });

    it("skips tabs without an id and no-ops on an empty set", async () => {
        await closeTabs([{ title: "No id", url: "https://a" }]);
        expect(remove).not.toHaveBeenCalled();

        await closeTabs([]);
        expect(remove).not.toHaveBeenCalled();
    });
});
