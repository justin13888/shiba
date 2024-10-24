import { SuspenseImage } from "@/components/image";
import { StatusBar } from "@/components/statusbar";
import { Toaster, showToast } from "@/components/ui/toast";
import type { TabGroup } from "@/types/model";
import { diffDate } from "@/utils";
import { deleteTabGroup, getTabsByIds } from "@/utils/db";
import { Title } from "@solidjs/meta";
import { createQuery } from "@tanstack/solid-query";
import { type Component, Show } from "solid-js";

// TODO: Implement style
// TODO: Implement search bar
const Saved: Component = () => {
    // createEffect(async () => {
    //     console.log("a",await faviconFromString("https://tanstack.com/favicon.ico"));
    // console.log("b",await faviconFromString("https://github.githubassets.com/favicons/favicon-dark.svg"));
    // })
    const [maxTabGroups, setMaxTabGroups] = createSignal<number | undefined>(
        10,
    ); // TODO: Make UI edit it
    // TODO: Fix loading issue when maxTabGroups is undefined
    // TODO: Make custom order (not in order of date) possible by modifying data structure and adding UI
    //   const {
    //     data: tabGroups,
    //     isSuccess: isTabGroupsSuccess,
    //     isError: isTabGroupsError,
    //     error: tabGroupsError,
    //     refetch: tabGroupsRefetch,
    //   }
    // TODO: Implement pagination for infinite query
    const tabGroupsQuery = createQuery(() => ({
        queryKey: ["tabgroups"],
        queryFn: getAllTabGroups,
        staleTime: 1000 * 60 * 1,
    }));

    // createEffect(
    //   on(tabCount, (value) => {
    //     console.log('Tab count:', value);
    //   })
    // )

    // createEffect(
    //   on(tabGroups, (value) => {
    //     console.log('Tab groups:', value);
    //   })
    // )

    // TODO: This code involves lots of duplicate db queries because no caching. Handle this with solid query (once it's stable)
    return (
        <>
            <Title>Saved | Shiba</Title>
            <div class="flex flex-col h-screen">
                {/* Header */}
                {/* TODO: Complete header */}
                <header class="flex-none">
                    <div class="flex flex-row flex-none items-baseline space-x-4 pb-4">
                        <p class="text-4xl font-extrabold">Shiba</p>
                    </div>
                    {/* Add search bar */}
                </header>
                {/* Tabs List */}
                <div class="flex flex-grow overflow-auto">
                    {/* TODO: Replace fallback with loading animation */}

                    <Switch fallback={<div>Loading...</div>}>
                        <Match when={tabGroupsQuery.isSuccess}>
                            <Show
                                when={tabGroupsQuery.data}
                                fallback={<div>There are no tab groups...</div>}
                            >
                                {(tabGroups) => (
                                    // {/* TODO: State of length seem to not correctly update to nothing. Only fixed after hard refresh */}
                                    <div class="flex-col space-y-6">
                                        <For each={tabGroups()}>
                                            {(tabGroup) => (
                                                <TabGroupList
                                                    {...{
                                                        tabGroup,
                                                        tabGroupsRefetch:
                                                            tabGroupsQuery.refetch,
                                                    }}
                                                />
                                            )}
                                        </For>
                                    </div>
                                    // {/* TODO: Implement pagination */}
                                )}
                            </Show>
                        </Match>
                        <Match when={tabGroupsQuery.isError}>
                            <div>Error: {tabGroupsQuery.error?.message}</div>
                        </Match>
                    </Switch>
                </div>
                {/* Status Bar */}
                <StatusBar />
            </div>
            <Toaster />
        </>
    );
};

interface TabGroupProps {
    tabGroup: TabGroup;
    tabGroupsRefetch: () => any;
}

function TabGroupList({ tabGroup, tabGroupsRefetch }: TabGroupProps) {
    console.log("tabGroup", tabGroup);
    const tabsQuery = createQuery(() => ({
        queryKey: ["tabs", tabGroup.id],
        queryFn: () => getTabsById(tabGroup.id),
        staleTime: 1000 * 60 * 1,
    }));

    return (
        <Switch fallback={<div>Loading...</div>}>
            <Match when={tabsQuery.isSuccess}>
                <Show when={tabsQuery.data}>
                    {(tabs) => (
                        <div class="m-4">
                            <div class="flex flex-row items-center space-x-4 pb-4">
                                <span class="pr-2 align-middle">
                                    {
                                        // TODO: Make name box editable
                                        tabGroup.name ? (
                                            <p class="font-semibold">
                                                {tabGroup.name}
                                            </p>
                                        ) : (
                                            <p class="font-semibold italic">
                                                Unnamed
                                            </p>
                                        )
                                    }
                                </span>
                                <button
                                    class="p-2 rounded-sm text-blue-600 hover:bg-blue-300"
                                    type="button"
                                    onClick={async () => {
                                        for (const tab of tabs()) {
                                            await browser.tabs.create({
                                                url: tab.url,
                                            });
                                        }
                                        deleteTabGroup(tabGroup.id);
                                        tabGroupsRefetch();
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabgroups"],
                                        });
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabs", tabGroup.id],
                                        });
                                        showToast({
                                            title: (
                                                <p>
                                                    Restored tabs{" "}
                                                    {
                                                        <Show
                                                            when={tabGroup.name}
                                                        >
                                                            {(name) => (
                                                                <span class="font-bold">
                                                                    {name()}
                                                                </span>
                                                            )}
                                                        </Show>
                                                    }
                                                </p>
                                            ),
                                            duration: 3000,
                                            variant: "success",
                                        });
                                    }}
                                >
                                    Restore All
                                </button>

                                <button
                                    class="p-2 rounded-sm text-blue-600 hover:bg-blue-300"
                                    type="button"
                                    onClick={async () => {
                                        await browser.windows.create({
                                            url: tabs().map((tab) => tab.url),
                                        });
                                        deleteTabGroup(tabGroup.id);
                                        tabGroupsRefetch();
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabgroups"],
                                        });
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabs", tabGroup.id],
                                        });
                                        showToast({
                                            title: (
                                                <p>
                                                    Restored tabs{" "}
                                                    {
                                                        <Show
                                                            when={tabGroup.name}
                                                        >
                                                            {(name) => (
                                                                <span class="font-bold">
                                                                    {name()}
                                                                </span>
                                                            )}
                                                        </Show>
                                                    }{" "}
                                                    in new window
                                                </p>
                                            ),
                                            duration: 3000,
                                            variant: "success",
                                        });
                                    }}
                                >
                                    Restore All in New Window
                                </button>

                                <button
                                    class="p-2 rounded-sm text-red-600 hover:bg-red-300"
                                    type="button"
                                    onClick={() => {
                                        deleteTabGroup(tabGroup.id);
                                        tabGroupsRefetch();
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabgroups"],
                                        });
                                        queryClient.invalidateQueries({
                                            queryKey: ["tabs", tabGroup.id],
                                        });
                                        showToast({
                                            title: (
                                                <p>
                                                    Deleted tabs{" "}
                                                    {
                                                        <Show
                                                            when={tabGroup.name}
                                                        >
                                                            {(name) => (
                                                                <span class="font-bold">
                                                                    {name()}
                                                                </span>
                                                            )}
                                                        </Show>
                                                    }
                                                </p>
                                            ),
                                            duration: 3000,
                                            variant: "destructive",
                                        }); // TODO: Make toast allow undo
                                    }}
                                >
                                    Delete All
                                </button>
                                <p class="pl-4">
                                    Last modified{" "}
                                    {diffDate(tabGroup.timeModified)}
                                </p>
                            </div>
                            {/* TODO: Display favicon */}
                            {/* TODO: Current tab interactions include: Delete, Restore */}
                            {/* TODO: Add "restore all", "Delete all" */}
                            {/* TODO: Display timeCreated */}
                            {/* TODO: Make file explorer like keyboard shortcuts work (e.g. Ctrl+A, Shift) */}
                            <ul class="pl-2 space-y-1">
                                <For each={tabs()}>
                                    {/* TODO: Display tab group categories properly */}
                                    {/* TODO: Display notes */}
                                    {(tab) => (
                                        <li>
                                            <span class="flex flex-row items-center space-x-4">
                                                <SuspenseImage
                                                    src={tab.favicon}
                                                    fallbackSrc="/dogface.ico"
                                                    alt="Favicon logo"
                                                    height={20}
                                                    width={20}
                                                />

                                                <a
                                                    href={tab.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    class="text-blue-600"
                                                    onClick={async (event) => {
                                                        if (!event.shiftKey) {
                                                            // TODO: check if tab is already open
                                                            // Remove the tab from the group
                                                            await deleteTab(
                                                                tab.id,
                                                            );
                                                            tabsQuery.refetch();
                                                        }
                                                    }}
                                                >
                                                    {tab.title}
                                                </a>
                                            </span>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </div>
                    )}
                </Show>
            </Match>
            <Match when={tabsQuery.isError}>
                <div>Error: {tabsQuery.error?.message}</div>
            </Match>
        </Switch>
    );
}

export default Saved;
// TODO: Implement loading as Skeleton
// TODO: Make UI drag and drop
