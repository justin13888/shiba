import { Skeleton } from "@/components/ui/skeleton";
import { Tab, TabGroup } from "@/types/model";
import { switchToOrOpenTab } from "@/utils";
import { URLS } from "@/utils/constants";
import { addTabBundle, clearTabs } from "@/utils/db";
import { queryClient } from "@/utils/query";
import { tabCount, tabDBRefetch } from "@/utils/store";
import { saveCurrentTab, saveCurrentWindow } from "@/utils/tabs";

// TODO: Style
function App() {
    return (
        <div class="w-[300px] h-[300px] flex flex-col items-center justify-between p-1 bg-gray-100 rounded-sm">
            <div class="flex flex-col grow text-center items-center p-4">
                <Show
                    when={
                        tabCount.state === "ready" ||
                        tabCount.state === "refreshing"
                    }
                    fallback={<Skeleton height={72} width={62} radius={10} />}
                >
                    <p class="text-7xl font-extrabold text-gray-800">
                        {tabCount()}
                    </p>
                </Show>
                <p>Tabs Saved</p>
            </div>

            {/* Save Buttons */}
            <div class="grid grid-cols-2 gap-1">
                <For
                    each={
                        [
                            [
                                "Save Current Tab",
                                async () => {
                                    const savedTabId = await saveCurrentTab();
                                    tabDBRefetch(); // TODO: Remove
                                    await switchToOrOpenTab(URLS.SAVED);
                                    if (savedTabId !== undefined) {
                                        browser.tabs.remove(savedTabId);
                                    }
                                    queryClient.invalidateQueries({
                                        queryKey: ["tabgroups"],
                                    });
                                    // TODO: Force refresh all saved pages (since the DB has been replaced)
                                },
                            ],
                            [
                                "Save All Tabs",
                                async () => {
                                    const savedTabIds =
                                        await saveCurrentWindow();
                                    tabDBRefetch(); // TODO: Remove
                                    await switchToOrOpenTab(URLS.SAVED);
                                    for (const tabId of savedTabIds) {
                                        browser.tabs.remove(tabId);
                                    }
                                    queryClient.invalidateQueries({
                                        queryKey: ["tabgroups"],
                                    });
                                    // TODO: Force refresh all saved pages (since the DB has been replaced)
                                },
                            ],
                            [
                                "Open Debug",
                                () => {
                                    switchToOrOpenTab(URLS.DEBUG);
                                },
                            ],
                            [
                                "Open Saved",
                                () => {
                                    switchToOrOpenTab(URLS.SAVED);
                                },
                            ],
                            [
                                "Open Options",
                                () => {
                                    switchToOrOpenTab(URLS.OPTIONS);
                                },
                            ],
                            [
                                "Open History",
                                () => {
                                    switchToOrOpenTab(URLS.HISTORY);
                                },
                            ],
                            [
                                "Seed",
                                async () => {
                                    const testUrls = Object.freeze([
                                        {
                                            favicon:
                                                "https://www.typescriptlang.org/favicon-32x32.png?v=8944a05a8b601855de116c8a56d3b3ae",
                                            title: "TypeScript: JavaScript With Syntax For Types.",
                                            url: "https://www.typescriptlang.org/",
                                        },
                                        {
                                            favicon:
                                                "https://huggingface.co/favicon.ico",
                                            title: "sentence-transformers (Sentence Transformers)",
                                            url: "https://huggingface.co/sentence-transformers",
                                        },
                                        {
                                            favicon:
                                                "https://vitejs.dev/logo.svg",
                                            title: "Vite | Next Generation Frontend Tooling",
                                            url: "https://vitejs.dev/",
                                        },
                                        {
                                            favicon:
                                                "https://www.rust-lang.org/static/images/favicon.svg",
                                            title: "Rust Programming Language",
                                            url: "https://www.rust-lang.org/",
                                        },
                                        {
                                            favicon:
                                                "https://www.sbert.net/_static/favicon.ico",
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
                                            favicon:
                                                "https://docs.astral.sh/ruff/assets/ruff-favicon.png",
                                            title: "Ruff",
                                            url: "https://docs.astral.sh/ruff/",
                                        },
                                        {
                                            favicon:
                                                "https://biomejs.dev/img/favicon.svg",
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
                                            favicon:
                                                "https://www.solidjs.com/img/favicons/favicon-32x32.png",
                                            title: "SolidJS · Reactive Javascript Library",
                                            url: "https://www.solidjs.com/",
                                        },
                                    ]);

                                    const newTabGroup = new TabGroup();

                                    const newTabs: Tab[] = testUrls.map(
                                        ({ favicon, title, url }) =>
                                            new Tab({
                                                groupId: newTabGroup.id,
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
                                },
                            ],
                            [
                                "Clear All",
                                async () => {
                                    await clearTabs();
                                    tabDBRefetch();
                                },
                            ],
                        ] as [string, () => void | Promise<void>][]
                    }
                >
                    {([text, handler]) => (
                        <button
                            onClick={handler}
                            type="button"
                            class="p-4 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                        >
                            {text}
                        </button>
                    )}
                </For>

                {/* TODO: Remove extra buttons after major changes */}
            </div>
        </div>
    );
}

export default App;
