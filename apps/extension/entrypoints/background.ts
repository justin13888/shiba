import { type BrowserTab, queries } from "@shiba/core";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import {
    closeTabs,
    savableCurrentWindow,
    webextTabs,
} from "@/src/adapters/tabs";
import {
    getWorkerRuntime,
    manageSync,
    registerMaintenanceAlarms,
    serveBridge,
} from "@/src/runtime/background";

/**
 * Save tabs into the default workspace. Returns whether a save was actually
 * dispatched (non-empty list + a resolved workspace) — callers use this to
 * decide whether it's safe to close the tabs.
 */
async function saveTabs(tabs: BrowserTab[]): Promise<boolean> {
    if (tabs.length === 0) return false;
    const rt = await getWorkerRuntime();
    const ws = queries.defaultWorkspace(rt.doc.snapshot());
    if (!ws) return false;
    rt.dispatch({
        type: "saveBrowserTabs",
        tabs,
        options: { workspaceId: ws.id },
    });
    return true;
}

/** Save the tabs, then close them if the save succeeded (OneTab-style). */
async function saveAndClose(tabs: BrowserTab[]): Promise<void> {
    if (await saveTabs(tabs)) await closeTabs(tabs);
}

export default defineBackground(() => {
    // Own the document + serve the page bridge (RPC + live doc port).
    serveBridge(getWorkerRuntime);
    // Periodic maintenance: compaction + the document self-heal sweep.
    registerMaintenanceAlarms(getWorkerRuntime);
    // Build eagerly so the doc is loaded/persisted even before a page connects,
    // and run the encrypted sync engine here (not in a page) against that doc.
    void getWorkerRuntime().then((rt) => manageSync(rt.doc));

    // Clicking the toolbar icon stashes the current window and opens Shiba in one
    // move (no popup). Open the app tab *before* closing so the window survives
    // when every regular tab is removed.
    //
    // `browser.action` is the MV3 (Chrome) namespace; Firefox MV2 only exposes
    // `browser.browserAction`. WXT doesn't normalize the two, so referencing
    // `browser.action` directly is `undefined` on Firefox and throws here at
    // startup — which aborts the rest of this callback, taking the context-menu
    // and command listeners below down with it. Pick whichever the build has.
    const action = browser.action ?? browser.browserAction;
    action.onClicked.addListener(async () => {
        const tabs = await savableCurrentWindow();
        const saved = await saveTabs(tabs);
        await browser.tabs.create({
            url: browser.runtime.getURL("/index.html"),
        });
        if (saved) await closeTabs(tabs);
    });

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
        await saveAndClose([
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
            await saveAndClose(await webextTabs.queryHighlighted());
        } else if (command === "save-all-tabs") {
            await saveAndClose(await savableCurrentWindow());
        } else if (command === "open-saved") {
            await browser.tabs.create({
                url: browser.runtime.getURL("/index.html"),
            });
        }
    });
});
