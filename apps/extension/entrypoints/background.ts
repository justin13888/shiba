import { type BrowserTab, queries } from "@shiba/core";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { webextTabs } from "@/src/adapters/tabs";
import {
    getWorkerRuntime,
    manageSync,
    serveBridge,
} from "@/src/runtime/background";

async function saveTabs(tabs: BrowserTab[]): Promise<void> {
    if (tabs.length === 0) return;
    const rt = await getWorkerRuntime();
    const ws = queries.defaultWorkspace(rt.doc.snapshot());
    if (!ws) return;
    rt.dispatch({
        type: "saveBrowserTabs",
        tabs,
        options: { workspaceId: ws.id },
    });
}

export default defineBackground(() => {
    // Own the document + serve the page bridge (RPC + live doc port).
    serveBridge(getWorkerRuntime);
    // Build eagerly so the doc is loaded/persisted even before a page connects,
    // and run the encrypted sync engine here (not in a page) against that doc.
    void getWorkerRuntime().then((rt) => manageSync(rt.doc));

    browser.runtime.onInstalled.addListener(() => {
        browser.contextMenus.create({
            id: "shiba-save-tab",
            title: "Save tab to Shiba",
            contexts: ["page"],
        });
    });

    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId !== "shiba-save-tab" || !tab?.url || !tab.title)
            return;
        await saveTabs([
            {
                id: tab.id,
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl,
                windowId: tab.windowId,
            },
        ]);
    });

    browser.commands.onCommand.addListener(async (command) => {
        if (command === "save-selected-tabs") {
            await saveTabs(await webextTabs.queryHighlighted());
        } else if (command === "save-all-tabs") {
            await saveTabs(await webextTabs.queryCurrentWindow());
        } else if (command === "open-saved") {
            await browser.tabs.create({
                url: browser.runtime.getURL("/index.html"),
            });
        }
    });
});
