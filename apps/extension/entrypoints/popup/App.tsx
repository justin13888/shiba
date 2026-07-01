import { queries } from "@shiba/core";
import { FolderOpen, Save } from "lucide-solid";
import type { Component } from "solid-js";
import { browser } from "wxt/browser";
import { webextTabs } from "@/src/adapters/tabs";
import { Button } from "@/src/lib/ui/button";
import { connectBridge } from "@/src/runtime/bridge/client";

async function saveCurrentWindow(): Promise<void> {
    const client = await connectBridge();
    try {
        const ws = queries.defaultWorkspace(client.doc.snapshot());
        if (!ws) return;
        const tabs = await webextTabs.queryCurrentWindow();
        await client.dispatch({
            type: "saveBrowserTabs",
            tabs,
            options: { workspaceId: ws.id },
        });
    } finally {
        client.dispose();
        window.close();
    }
}

function openApp(): void {
    void browser.tabs.create({ url: browser.runtime.getURL("/index.html") });
    window.close();
}

export const App: Component = () => (
    <div class="w-64 space-y-2 bg-background p-3 text-foreground">
        <h1 class="px-1 text-sm font-semibold">🐕 Shiba</h1>
        <Button class="w-full" onClick={saveCurrentWindow}>
            <Save class="h-4 w-4" /> Save this window
        </Button>
        <Button class="w-full" variant="outline" onClick={openApp}>
            <FolderOpen class="h-4 w-4" /> Open Shiba
        </Button>
    </div>
);
