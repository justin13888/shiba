import { Skeleton } from "@/components/ui/skeleton";
import { Tab, TabGroup } from "@/types/model";
import { addTabBundle, clearTabs } from "@/utils/db";
import { saveAllTabs, saveCurrentTab } from "@/utils/tabs";
import { switchToOrOpenTab } from "@/utils";
import { URLS } from "@/utils/constants";
import { tabCount, tabDBRefetch } from "@/utils/store";

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
                    fallback={
                        <Skeleton height={72} width={62} radius={10} />
                    }
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
                                    const savedTabId =
                                        await saveCurrentTab();
                                    tabDBRefetch();
                                    await switchToOrOpenTab(URLS.SAVED);
                                    if (savedTabId !== undefined) {
                                        browser.tabs.remove(savedTabId);
                                    }
                                    // TODO: Force refresh all saved pages (since the DB has been replaced)
                                },
                            ],
                            [
                                "Save All Tabs",
                                async () => {
                                    const savedTabIds = await saveAllTabs();
                                    tabDBRefetch();
                                    await switchToOrOpenTab(URLS.SAVED);
                                    for (const tabId of savedTabIds) {
                                        browser.tabs.remove(tabId);
                                    }
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
                                    // TODO: Remove this later after testing
                                    const newTabGroup = new TabGroup();
                                    const newTabs = Array.from(
                                        { length: 10 },
                                        () => {
                                            const tab = new Tab({
                                                title: "Test Tab",
                                                url: "https://example.com",
                                                tabGroupId:
                                                    newTabGroup.groupId,
                                            });
                                            tab.tabGroupId =
                                                newTabGroup.groupId;
                                            return tab;
                                        },
                                    );

                                    addTabBundle([newTabGroup, newTabs]);

                                    tabDBRefetch();
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
