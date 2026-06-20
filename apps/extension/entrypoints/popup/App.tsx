import { ops, queries } from "@shiba/core";
import { FolderOpen, Save } from "lucide-solid";
import type { Component } from "solid-js";
import { browser } from "wxt/browser";
import { webextTabs } from "@/src/adapters/tabs";
import { Button } from "@/src/lib/ui/button";
import { createRuntime } from "@/src/runtime/container";

async function saveCurrentWindow(): Promise<void> {
    const rt = await createRuntime();
    const ws = queries.defaultWorkspace(rt.doc.snapshot());
    if (!ws) return;
    const tabs = await webextTabs.queryCurrentWindow();
    rt.commit((tx) =>
        ops.saveBrowserTabs(tx, rt.deps, tabs, { workspaceId: ws.id }),
    );
    window.close();
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
