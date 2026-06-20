import type { ImportedData, ImportedGroup, ImportedTab } from "./types";

/**
 * BetterOneTab export format: a JSON array of lists, each `{ title?, tabs: [{
 * url, title }] }`. Lenient — skips malformed entries rather than throwing.
 */
export function parseBetterOneTab(json: string): ImportedData {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) {
        throw new Error(
            "Invalid BetterOneTab export: expected a top-level array",
        );
    }
    const groups: ImportedData = [];
    for (const entry of data) {
        if (!entry || typeof entry !== "object") continue;
        const list = entry as { title?: unknown; tabs?: unknown };
        if (!Array.isArray(list.tabs)) continue;
        const tabs: ImportedTab[] = [];
        for (const t of list.tabs) {
            if (!t || typeof t !== "object") continue;
            const tab = t as { url?: unknown; title?: unknown };
            if (typeof tab.url !== "string" || tab.url === "") continue;
            const title =
                typeof tab.title === "string" && tab.title
                    ? tab.title
                    : tab.url;
            tabs.push({ url: tab.url, title });
        }
        if (tabs.length > 0) {
            const group: ImportedGroup = { tabs };
            if (typeof list.title === "string" && list.title)
                group.name = list.title;
            groups.push(group);
        }
    }
    return groups;
}
