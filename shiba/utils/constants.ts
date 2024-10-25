import { browser } from "wxt/browser";

export const URLS = {
    ANALYTICS: browser.runtime.getURL("/index.html#/analytics"),
    EXPORT: browser.runtime.getURL("/index.html#/export"),
    HISTORY: browser.runtime.getURL("/index.html#/history"),
    IMPORT: browser.runtime.getURL("/index.html#/import"),
    SAVED: browser.runtime.getURL("/index.html#/saved"),

    GETTING_STARTED: browser.runtime.getURL("/getting-started.html"),
    OPTIONS: browser.runtime.getURL("/options.html"),
    DEBUG: browser.runtime.getURL("/debug.html"),
} as const;
