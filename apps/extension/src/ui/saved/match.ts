import type { Tab } from "@shiba/core";

/** Case-insensitive substring match over a tab's title and URL. */
export const matchesQuery = (tab: Tab, q: string): boolean =>
    q === "" ||
    tab.title.toLowerCase().includes(q) ||
    tab.url.toLowerCase().includes(q);
