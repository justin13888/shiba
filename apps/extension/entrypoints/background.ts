import { type BrowserTab, ops, queries } from "@shiba/core";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { webextTabs } from "@/src/adapters/tabs";
import { createRuntime } from "@/src/runtime/container";

async function saveTabs(tabs: BrowserTab[]): Promise<void> {
    if (tabs.length === 0) return;
    const rt = await createRuntime();
    const ws = queries.defaultWorkspace(rt.doc.snapshot());
    if (!ws) return;
    rt.commit((tx) =>
        ops.saveBrowserTabs(tx, rt.deps, tabs, { workspaceId: ws.id }),
    );
}

export default defineBackground(() => {
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
