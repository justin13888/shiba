import type { BrowserTab, BrowserTabs } from "@shiba/core";
import type { Tabs } from "webextension-polyfill";
import { browser } from "wxt/browser";

function convert(tab: Tabs.Tab): BrowserTab | null {
    if (!tab.url || !tab.title) return null;
    return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        windowId: tab.windowId,
    };
}

const collect = (tabs: Tabs.Tab[]): BrowserTab[] =>
    tabs.map(convert).filter((t): t is BrowserTab => t !== null);

/** {@link BrowserTabs} backed by the WebExtension `tabs`/`windows` APIs. */
export const webextTabs: BrowserTabs = {
    async queryHighlighted() {
        return collect(
            await browser.tabs.query({
                highlighted: true,
                currentWindow: true,
            }),
        );
    },
    async queryCurrentWindow() {
        return collect(await browser.tabs.query({ currentWindow: true }));
    },
    async queryAllWindows() {
        return collect(await browser.tabs.query({}));
    },
    async open(urls, options) {
        if (options?.newWindow) {
            await browser.windows.create({ url: urls });
            return;
        }
        for (const url of urls) await browser.tabs.create({ url });
    },
    async close(ids) {
        await browser.tabs.remove(ids);
    },
    async focusOrOpen(url) {
        const match = (await browser.tabs.query({})).find((t) => t.url === url);
        if (match?.id != null) {
            await browser.tabs.update(match.id, { active: true });
            if (match.windowId != null) {
                await browser.windows.update(match.windowId, { focused: true });
            }
        } else {
            await browser.tabs.create({ url });
        }
    },
};

/**
 * The OneTab-style "save this window" set: regular (non-pinned) tabs of the
 * current window, minus the extension's own page. Pinned tabs are deliberately
 * left alone, and Shiba never stashes/closes itself.
 */
export async function savableCurrentWindow(): Promise<BrowserTab[]> {
    const appOrigin = browser.runtime.getURL("/");
    const tabs = await browser.tabs.query({
        currentWindow: true,
        pinned: false,
    });
    return collect(tabs).filter((tab) => !tab.url.startsWith(appOrigin));
}

/** Close the given tabs by id, skipping any without one. */
export async function closeTabs(tabs: BrowserTab[]): Promise<void> {
    const ids = tabs
        .map((tab) => tab.id)
        .filter((id): id is number => id != null);
    if (ids.length > 0) await webextTabs.close(ids);
}
