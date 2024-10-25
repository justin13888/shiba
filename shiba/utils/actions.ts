import { Tab, TabGroup } from "@/types/model";
import { browser } from "wxt/browser";
import { switchToOrOpenTab } from ".";
import { URLS } from "./constants";
import { addTabBundle } from "./db";
import { queryClient } from "./query";
import { tabDBRefetch } from "./store";
import { saveCurrentWindow, storeSelectedTabs } from "./tabs";

/**
 * Save selected tabs
 */
export async function saveSelectedTabs() {
    const savedTabId = await storeSelectedTabs();
    tabDBRefetch(); // TODO: Remove
    await switchToOrOpenTab(URLS.SAVED);
    if (savedTabId !== undefined) {
        browser.tabs.remove(savedTabId);
    }
    queryClient.invalidateQueries({
        queryKey: ["tabgroups"],
    });
    // TODO: Force refresh all saved pages (since the DB has been replaced)
}

/**
 * Save all tabs
 */
export async function saveAllTabs() {
    const savedTabIds = await saveCurrentWindow();
    tabDBRefetch(); // TODO: Remove
    await switchToOrOpenTab(URLS.SAVED);
    for (const tabId of savedTabIds) {
        browser.tabs.remove(tabId);
    }
    queryClient.invalidateQueries({
        queryKey: ["tabgroups"],
    });
    // TODO: Force refresh all saved pages (since the DB has been replaced)
}

/**
 * Seed database with test data
 */
export async function addSeedTabs() {
    const testUrls = Object.freeze([
        {
            favicon:
                "https://www.typescriptlang.org/favicon-32x32.png?v=8944a05a8b601855de116c8a56d3b3ae",
            title: "TypeScript: JavaScript With Syntax For Types.",
            url: "https://www.typescriptlang.org/",
        },
        {
            favicon: "https://huggingface.co/favicon.ico",
            title: "sentence-transformers (Sentence Transformers)",
            url: "https://huggingface.co/sentence-transformers",
        },
        {
            favicon: "https://vitejs.dev/logo.svg",
            title: "Vite | Next Generation Frontend Tooling",
            url: "https://vitejs.dev/",
        },
        {
            favicon: "https://www.rust-lang.org/static/images/favicon.svg",
            title: "Rust Programming Language",
            url: "https://www.rust-lang.org/",
        },
        {
            favicon: "https://www.sbert.net/_static/favicon.ico",
            title: "SentenceTransformers Documentation — Sentence Transformers documentation",
            url: "https://www.sbert.net/",
        },
        {
            favicon:
                "https://github.githubassets.com/favicons/favicon-dark.svg",
            title: "GitHub Packages: Your packages, at home with their code · GitHub",
            url: "https://github.com/features/packages",
        },
        {
            favicon:
                "https://www.youtube.com/s/desktop/d44eab58/img/favicon_32x32.png",
            title: "Meet Llama 3.1 - YouTube",
            url: "https://www.youtube.com/watch?v=kv1qGLlw9yg",
        },
        {
            favicon: "https://docs.astral.sh/ruff/assets/ruff-favicon.png",
            title: "Ruff",
            url: "https://docs.astral.sh/ruff/",
        },
        {
            favicon: "https://biomejs.dev/img/favicon.svg",
            title: "Biome, toolchain of the web",
            url: "https://biomejs.dev/",
        },
        {
            favicon:
                "https://posthog.com/favicon.svg?v=6e5ac8d4a5b381b5caa29396fbf7c955",
            title: "PostHog - How developers build successful products",
            url: "https://posthog.com/",
        },
        {
            favicon: "https://www.solidjs.com/img/favicons/favicon-32x32.png",
            title: "SolidJS · Reactive Javascript Library",
            url: "https://www.solidjs.com/",
        },
    ]);

    const newTabGroup = new TabGroup();

    const newTabs: Tab[] = testUrls.map(
        ({ favicon, title, url }, index) =>
            new Tab({
                groupId: newTabGroup.id,
                order: index,
                favicon,
                title,
                url,
            }),
    );

    await addTabBundle([newTabGroup, newTabs]);

    queryClient.invalidateQueries({
        queryKey: ["tabgroups"],
    });
    tabDBRefetch(); // TODO: Replace this
    await switchToOrOpenTab(URLS.SAVED);
}
