import { SuspenseImage } from "@/components/image";
import { StatusBar } from "@/components/statusbar";
import { Toaster, showToast } from "@/components/ui/toast";
import { diffDate } from "@/utils";
import { deleteTabGroup, getTabs } from "@/utils/db";
import { Title } from "@solidjs/meta";
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
    const [tabGroups, { refetch: tabGroupsRefetch }] = createResource(
        maxTabGroups(),
        async (num) => {
            return (await getTabs(num)).sort(
                (a, b) => b[0].timeCreated - a[0].timeCreated,
            );
        },
    );

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

    return (
        <>
            <Title>Saved | Shiba</Title>
            <div class="flex flex-col min-h-screen">
                {/* Header */}
                <div class="flex-none overflow-auto">
                    <div class="flex flex-row flex-none items-baseline space-x-4 pb-4">
                        <p class="text-4xl font-extrabold">Shiba</p>
                        {/* TODO: Replace fallback with loading animation */}
                        <Show
                            when={tabCount.state === "ready"}
                            fallback={<p>Loading...</p>}
                        >
                            <p class="text-xl">{tabCount()} Tabs Saved</p>
                        </Show>
                    </div>
                </div>
                {/* Tabs List */}
                <div class="flex flex-grow">
                    {/* TODO: Replace fallback with loading animation */}
                    <Show
                        when={tabGroups()}
                        fallback={<p>Loading...</p>} // TODO: Make it look better
                    >
                        {(tabGroups) => (
                            // {/* TODO: State of length seem to not correctly update to nothing. Only fixed after hard refresh */}
                            <Switch
                                fallback={
                                    <div class="flex justify-center w-full">
                                        <p class="text-xl font-medium pt-4">There are no tabs...</p>
                                    </div>
                                }
                            >
                                <Match when={tabGroups().length > 0}>
                                    <div class="flex-col space-y-6">
                                        <For each={tabGroups()}>
                                            {([tabGroup, tabs]) => (
                                                <div class="m-4">
                                                    <div class="flex flex-row items-center space-x-4 pb-4">
                                                        <span class="pr-2 align-middle">
                                                            {
                                                                // TODO: Make name box editable
                                                                tabGroup.name ? (
                                                                    <p class="font-semibold">
                                                                        {
                                                                            tabGroup.name
                                                                        }
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
                                                            onClick={() => {
                                                                for (const tab of tabs) {
                                                                    browser.tabs.create(
                                                                        {
                                                                            url: tab.url,
                                                                        },
                                                                    );
                                                                }
                                                                deleteTabGroup(
                                                                    tabGroup.groupId,
                                                                );
                                                                tabGroupsRefetch();
                                                                showToast({
                                                                    title: (
                                                                        <p>
                                                                            Restored
                                                                            tabs{" "}
                                                                            {
                                                                                <Show
                                                                                    when={
                                                                                        tabGroup.name
                                                                                    }
                                                                                >
                                                                                    {(
                                                                                        name,
                                                                                    ) => (
                                                                                        <span class="font-bold">
                                                                                            {name()}
                                                                                        </span>
                                                                                    )}
                                                                                </Show>
                                                                            }
                                                                        </p>
                                                                    ),
                                                                    duration: 3000,
                                                                    variant:
                                                                        "success",
                                                                });
                                                            }}
                                                        >
                                                            Restore All
                                                        </button>

                                                        <button
                                                            class="p-2 rounded-sm text-blue-600 hover:bg-blue-300"
                                                            type="button"
                                                            onClick={async () => {
                                                                await browser.windows.create(
                                                                    {
                                                                        url: tabs.map(
                                                                            (
                                                                                tab,
                                                                            ) =>
                                                                                tab.url,
                                                                        ),
                                                                    },
                                                                );
                                                                deleteTabGroup(
                                                                    tabGroup.groupId,
                                                                );
                                                                tabGroupsRefetch();
                                                                showToast({
                                                                    title: (
                                                                        <p>
                                                                            Restored
                                                                            tabs{" "}
                                                                            {
                                                                                <Show
                                                                                    when={
                                                                                        tabGroup.name
                                                                                    }
                                                                                >
                                                                                    {(
                                                                                        name,
                                                                                    ) => (
                                                                                        <span class="font-bold">
                                                                                            {name()}
                                                                                        </span>
                                                                                    )}
                                                                                </Show>
                                                                            }{" "}
                                                                            in
                                                                            new
                                                                            window
                                                                        </p>
                                                                    ),
                                                                    duration: 3000,
                                                                    variant:
                                                                        "success",
                                                                });
                                                            }}
                                                        >
                                                            Restore All in New
                                                            Window
                                                        </button>

                                                        <button
                                                            class="p-2 rounded-sm text-red-600 hover:bg-red-300"
                                                            type="button"
                                                            onClick={() => {
                                                                deleteTabGroup(
                                                                    tabGroup.groupId,
                                                                );
                                                                tabGroupsRefetch();
                                                                showToast({
                                                                    title: (
                                                                        <p>
                                                                            Deleted
                                                                            tabs{" "}
                                                                            {
                                                                                <Show
                                                                                    when={
                                                                                        tabGroup.name
                                                                                    }
                                                                                >
                                                                                    {(
                                                                                        name,
                                                                                    ) => (
                                                                                        <span class="font-bold">
                                                                                            {name()}
                                                                                        </span>
                                                                                    )}
                                                                                </Show>
                                                                            }
                                                                        </p>
                                                                    ),
                                                                    duration: 3000,
                                                                    variant:
                                                                        "destructive",
                                                                }); // TODO: Make toast allow undo
                                                            }}
                                                        >
                                                            Delete All
                                                        </button>
                                                        <p class="pl-4">
                                                            {diffDate(
                                                                tabGroup.timeCreated,
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* TODO: Display favicon */}
                                                    {/* TODO: Current tab interactions include: Delete, Restore */}
                                                    {/* TODO: Add "restore all", "Delete all" */}
                                                    {/* TODO: Display timeCreated */}
                                                    {/* TODO: Make file explorer like keyboard shortcuts work (e.g. Ctrl+A, Shift) */}
                                                    <ul class="pl-2 space-y-1">
                                                        <For each={tabs}>
                                                            {(tab) => (
                                                                <li>
                                                                    <span class="flex flex-row items-center space-x-4">
                                                                        <SuspenseImage
                                                                            src={
                                                                                tab.favicon
                                                                            }
                                                                            fallbackSrc="/dogface.ico"
                                                                            alt="Favicon logo"
                                                                            height={
                                                                                20
                                                                            }
                                                                            width={
                                                                                20
                                                                            }
                                                                        />

                                                                        <a
                                                                            href={
                                                                                tab.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            class="text-blue-600"
                                                                        >
                                                                            {
                                                                                tab.title
                                                                            }
                                                                        </a>
                                                                    </span>
                                                                </li>
                                                            )}
                                                        </For>
                                                    </ul>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Match>
                            </Switch>
                            // {/* TODO: Implement pagination */}
                        )}
                    </Show>
                </div>
                {/* Status Bar */}
                <StatusBar />
            </div>
            <Toaster />
        </>
    );
};

export default Saved;
// TODO: Implement loading as Skeleton
