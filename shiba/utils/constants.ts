export const URLS = {
    SAVED: browser.runtime.getURL("/index.html#/saved"),
    IMPORT: browser.runtime.getURL("/index.html#/import"),
    EXPORT: browser.runtime.getURL("/index.html#/export"),

    GETTING_STARTED: browser.runtime.getURL("/getting-started.html"),
    DEBUG: browser.runtime.getURL("/debug.html"),
} as const;
