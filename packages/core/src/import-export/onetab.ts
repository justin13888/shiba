import type { ImportedData, ImportedGroup } from "./types";

/**
 * OneTab export format: one `url | title` per line, blank lines separating
 * groups. Lenient: a line without `|` is treated as a bare URL; only the first
 * `|` splits, so titles may contain `|`.
 */
export function parseOneTab(text: string): ImportedData {
    const groups: ImportedData = [];
    let current: ImportedGroup = { tabs: [] };

    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line === "") {
            if (current.tabs.length > 0) {
                groups.push(current);
                current = { tabs: [] };
            }
            continue;
        }
        const pipe = line.indexOf("|");
        const url = (pipe === -1 ? line : line.slice(0, pipe)).trim();
        const title = pipe === -1 ? "" : line.slice(pipe + 1).trim();
        if (url) current.tabs.push({ url, title: title || url });
    }
    if (current.tabs.length > 0) groups.push(current);
    return groups;
}

export function toOneTab(groups: ImportedData): string {
    return groups
        .map((g) => g.tabs.map((t) => `${t.url} | ${t.title}`).join("\n"))
        .join("\n\n");
}
