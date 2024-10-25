import { Skeleton } from "@/components/ui/skeleton";
import { switchToOrOpenTab } from "@/utils";
import { addSeedTabs, saveAllTabs } from "@/utils/actions";
import { URLS } from "@/utils/constants";
import { clearTabs } from "@/utils/db";
import { tabCount, tabDBRefetch } from "@/utils/store";
import { saveSelectedTabs } from "@/utils/tabs";
import { For, Show } from "solid-js";

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
                            ["Save Current Tab", saveSelectedTabs],
                            ["Save All Tabs", saveAllTabs],
                            ["Open Debug", () => switchToOrOpenTab(URLS.DEBUG)],
                            ["Open Saved", () => switchToOrOpenTab(URLS.SAVED)],
                            [
                                "Open Options",
                                () => switchToOrOpenTab(URLS.OPTIONS),
                            ],
                            [
                                "Open History",
                                () => switchToOrOpenTab(URLS.HISTORY),
                            ],
                            ["Seed", addSeedTabs],
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
