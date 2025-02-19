import { DarkModeSwitcher } from "@/components/dark-mode-switcher";
import { EditableCardTitle } from "@/components/editable-card-title";
import { SuspenseImage } from "@/components/image";
import { StatusBar } from "@/components/statusbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, TextFieldRoot } from "@/components/ui/text-field";
import { Toaster, showToast } from "@/components/ui/toast";
import type { Tab, TabGroup, Workspace } from "@/types/model";
import { cn, diffDate } from "@/utils";
import {
    deleteTab,
    deleteTabGroup,
    getAllTabGroups,
    getTabsById,
    updateTabGroup,
} from "@/utils/db";
import { queryClient } from "@/utils/query";
import { FormControlContext } from "@kobalte/core";
import type { DropdownMenuSubTriggerProps } from "@kobalte/core/dropdown-menu";
import { Title } from "@solidjs/meta";
import { createQuery } from "@tanstack/solid-query";
import { format, fromUnixTime } from "date-fns";
import {
    Briefcase,
    ExternalLink,
    GraduationCap,
    Grip,
    Home,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Undo,
    X,
} from "lucide-solid";
import {
    type Component,
    ComponentProps,
    For,
    Match,
    Show,
    Switch,
    createEffect,
    createSignal,
} from "solid-js";
import { browser } from "wxt/browser";
import { SearchBar } from "./saved/searchbar";
import { makePersisted } from "@solid-primitives/storage";

// TODO: Make entire page layout not scrollable besides the interior list
// TODO: Implement style

const Saved: Component = () => {
    // TODO: Replace with query
    const workspaces: Workspace[] = [
        { id: "default", name: "Default", order: 1, icon: undefined },
        {
            id: "work",
            name: "Work",
            order: 2,
            icon: () => <Briefcase class="w-4 h-4 mr-2" />,
        },
        {
            id: "school",
            name: "School",
            order: 3,
            icon: () => <GraduationCap class="w-4 h-4 mr-2" />,
        },
    ];

    const [activeWorkspace, setActiveWorkspace] = makePersisted(createSignal(
        workspaces[0].id,
    ), { storage: sessionStorage });

    // TODO: Fix overall layout so status layout works
    return (
        <>
            <Title>Saved | Shiba</Title>
            <div class="h-screen bg-background p-8">
                {/* Header */}
                {/* TODO: Complete header */}
                <header class="mb-4">
                    <div class="container grid h-16 grid-cols-3 items-center px-4">
                        <div class="flex items-center">
                            <p class="text-4xl font-extrabold">Shiba</p>
                        </div>
                        <div class="flex justify-center">
                            <SearchBar />
                        </div>
                        <div class="flex justify-end space-x-2">
                            <DarkModeSwitcher />
                        </div>
                    </div>
                </header>

                {/* Workspace section */}
                {/* TODO: Check overflow style here */}
                <main class="flex flex-grow">
                    <Tabs
                        defaultValue={activeWorkspace()}
                        onChange={setActiveWorkspace}
                        class="w-full mx-auto flex flex-col justify-between items-center"
                    >
                        <div class="flex justify-between items-center mb-6 space-x-8">
                            {/* TODO: Responsiveness looks funny */}
                            <TabsList class="bg-transparent border rounded-lg">
                                <For each={workspaces}>
                                    {(workspace) => (
                                        <TabsTrigger
                                            value={workspace.id}
                                            class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-10"
                                        >
                                            {workspace.icon ? (
                                                <workspace.icon />
                                            ) : (
                                                <Home class="w-4 h-4 mr-2" />
                                            )}
                                            <span class="max-w-20 truncate block">
                                                {workspace.name}
                                            </span>
                                        </TabsTrigger>
                                    )}
                                </For>
                            </TabsList>
                            <Button
                                class="justify-center items-center aspect-square"
                                size="icon"
                                // TODO: Hook it into add more workspaces
                            >
                                <Plus class="w-4 h-4" />
                            </Button>
                        </div>
                        <div class="overflow-y-auto">
                            <For each={workspaces}>
                                {/* URGENT */}
                                {(workspace) => (
                                    <TabsContent
                                        value={workspace.id}
                                        class="mt-0"
                                    >
                                        <div class="h-[calc(100vh-8rem)]">
                                            <WorkspaceContent
                                                workspaceId={workspace.id}
                                            />
                                        </div>
                                    </TabsContent>
                                )}
                            </For>
                        </div>
                    </Tabs>
                </main>

                {/* Status Bar */}
                <StatusBar />
            </div>
            <Toaster />
        </>
    );
};

interface WorkspaceTabProps {
    workspaceId: string;
}

function WorkspaceContent({ workspaceId }: WorkspaceTabProps) {
    // TODO: Implement infinite virtual list
    // TODO: Make custom order (not in order of date) possible by modifying data structure and adding UI
    // TODO: Implement pagination for infinite query

    // TODO: Make it properly fetch just by workspace id
    const tabGroupsQuery = createQuery(() => ({
        queryKey: ["tabgroups", workspaceId],
        queryFn: getAllTabGroups, // TODO: Make this fetch by workspace id
        staleTime: 1000 * 60 * 1,
    }));

    return (
        <Switch fallback={<div>Loading...</div>}>
            <Match when={tabGroupsQuery.isSuccess}>
                <Show when={tabGroupsQuery.data}>
                    {(tabGroups) => (
                        <Show
                            when={tabGroups().length > 0}
                            fallback={<div>There are no tab groups...</div>}
                        >
                            {/* TODO: State of length seem to not correctly update to nothing. Only fixed after hard refresh */}
                            <div class="flex-col space-y-6">
                                <For each={tabGroups()}>
                                    {(tabGroup) => (
                                        <TabGroupCard
                                            {...{
                                                tabGroup,
                                                tabGroupsRefetch:
                                                    tabGroupsQuery.refetch,
                                            }}
                                        />
                                    )}
                                </For>
                            </div>
                        </Show>
                    )}
                </Show>
            </Match>
            <Match when={tabGroupsQuery.isError}>
                <div>Error: {tabGroupsQuery.error?.message || "unknown"}</div>
            </Match>
        </Switch>
    );

    //   return <TabGroupCard tabGroup={group} tabGroupsRefetch={} />;
}

interface TabItemProps {
    tab: Tab;
    tabRefetch: () => any; // TODO: REmove this in favour of using global invalidation (in tanstack query)
}

function TabItem({ tab, tabRefetch }: TabItemProps) {
    return (
        // TODO: Make this draggable and optimistically update tab order (need to implement updateTab function)
        <li class="group flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-accent/50 transition-colors duration-200">
            {/* <div
        class="w-4 h-4 bg-gray-200 rounded-sm flex-shrink-0"
        aria-hidden="true"
      /> */}
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
                rel="noopener noreferrer"
                class="flex-grow text-sm text-primary hover:underline"
                onClick={async (event) => {
                    if (!event.shiftKey) {
                        // Remove the tab from the group unless shift is pressed
                        await deleteTab(tab.id);
                        tabRefetch();
                    }
                }}
            >
                {tab.title}
            </a>
            <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* {tab.tags.map((tag) => (
          <Badge key={tag} variant="secondary" class="text-xs">
            {tag}
          </Badge>
        ))} */}
                {/* TODO: Implement ^^ */}
                <DropdownMenu>
                    {/* TODO: Implement this */}
                    <DropdownMenuTrigger
                        as={(props: DropdownMenuSubTriggerProps) => (
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-6 w-6"
                                {...props}
                            >
                                <MoreHorizontal class="h-4 w-4" />
                                <span class="sr-only">
                                    More options for {tab.title}
                                </span>
                            </Button>
                        )}
                    />
                    <DropdownMenuContent>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                        {/* TODO: Update this menu which does nothing */}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={async () => {
                        if (await deleteTab(tab.id)) {
                            tabRefetch();
                            queryClient.invalidateQueries({
                                queryKey: ["tabgroups"],
                            }); // TODO: Figure out how to update this more finely
                        }
                    }}
                >
                    <X class="h-4 w-4" />
                    <span class="sr-only">Remove {tab.title}</span>
                </Button>
            </div>
        </li>
    );
}

interface TabGroupCardProps {
    tabGroup: TabGroup;
    tabGroupsRefetch: () => any;
}

function TabGroupCard({ tabGroup, tabGroupsRefetch }: TabGroupCardProps) {
    const tabsQuery = createQuery(() => ({
        queryKey: ["tabs", tabGroup.id],
        queryFn: () => getTabsById(tabGroup.id),
        staleTime: 1000 * 60 * 1,
    }));

    return (
        <Switch fallback={<div>Loading...</div>}>
            <Match when={tabsQuery.isSuccess}>
                {/* TODO: Make file explorer like keyboard shortcuts work (e.g. Ctrl+A, Shift) */}
                <Show
                    when={tabsQuery.data}
                    fallback={<p>There are no tabs...</p>}
                >
                    {(tabs) => (
                        // TODO: Add right click context menus for actions (e.g. move workspace, delete tab group)
                        <Card class="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                <EditableCardTitle
                                    initialValue={
                                        tabGroup.name ||
                                        `Untitled ${format(fromUnixTime(tabGroup.timeCreated / 1000), "yyyy-MM-dd HH:mm:ss")}`
                                    }
                                    onUpdateValue={async (name) => {
                                        const isUpdated = await updateTabGroup(
                                            tabGroup.id,
                                            {
                                                name,
                                            },
                                        );
                                        if (!isUpdated) {
                                            showToast({
                                                title: "Failed to title",
                                                duration: 3000,
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                    class="text-xl font-semibold"
                                />
                                <Grip
                                    class="text-muted-foreground cursor-move"
                                    size={20}
                                />
                            </CardHeader>
                            <CardContent>
                                <p class="text-sm text-muted-foreground mb-4">
                                    Last modified{" "}
                                    {diffDate(tabGroup.timeModified)}
                                    {/* TODO: might to bottom or in line with title */}
                                </p>
                                {/* TODO: Display tab group categories properly */}
                                {/* TODO: Display notes */}
                                <ul class="max-h-[300px] overflow-y-auto space-y-1 mb-4">
                                    <For each={tabs()}>
                                        {(tab) => (
                                            <TabItem
                                                tab={tab}
                                                tabRefetch={tabsQuery.refetch}
                                            />
                                        )}
                                    </For>
                                </ul>
                                <div class="flex justify-start space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        class="flex items-center"
                                        onClick={async () => {
                                            for (const tab of tabs()) {
                                                await browser.tabs.create({
                                                    url: tab.url,
                                                });
                                            }
                                            deleteTabGroup(tabGroup.id);
                                            tabGroupsRefetch();
                                            // queryClient.invalidateQueries({
                                            //     queryKey: ["tabgroups"],
                                            // });
                                            // queryClient.invalidateQueries({
                                            //     queryKey: ["tabs", tabGroup.id],
                                            // });
                                            showToast({
                                                title: (
                                                    <p>
                                                        Restored tabs{" "}
                                                        {
                                                            <Show
                                                                when={
                                                                    tabGroup.name
                                                                }
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
                                        <Undo class="h-4 w-4 mr-2" />
                                        Restore
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        class="flex items-center"
                                        onClick={async () => {
                                            await browser.windows.create({
                                                url: tabs().map(
                                                    (tab) => tab.url,
                                                ),
                                            });
                                            deleteTabGroup(tabGroup.id);
                                            tabGroupsRefetch();
                                            // queryClient.invalidateQueries({
                                            //     queryKey: ["tabgroups"],
                                            // });
                                            // queryClient.invalidateQueries({
                                            //     queryKey: ["tabs", tabGroup.id],
                                            // });
                                            showToast({
                                                title: (
                                                    <p>
                                                        Restored tabs{" "}
                                                        {
                                                            <Show
                                                                when={
                                                                    tabGroup.name
                                                                }
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
                                        <ExternalLink class="h-4 w-4 mr-2" />
                                        Restore in new window
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        class="flex items-center text-red-500 hover:text-red-600"
                                        onClick={async () => {
                                            if (
                                                await deleteTabGroup(
                                                    tabGroup.id,
                                                )
                                            ) {
                                                tabGroupsRefetch();
                                                // queryClient.invalidateQueries({
                                                //     queryKey: ["tabgroups"],
                                                // });
                                                // queryClient.invalidateQueries({
                                                //     queryKey: [
                                                //         "tabs",
                                                //         tabGroup.id,
                                                //     ],
                                                // });
                                                showToast({
                                                    title: (
                                                        <p>
                                                            Deleted tabs{" "}
                                                            {
                                                                <Show
                                                                    when={
                                                                        tabGroup.name
                                                                    }
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
                                            }
                                        }}
                                    >
                                        <Trash2 class="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </Show>
            </Match>
            <Match when={tabsQuery.isError}>
                <div>Error: {tabsQuery.error?.message || "unknown"}</div>
            </Match>
        </Switch>
    );
}

export default Saved;
// TODO: Implement loading as Skeleton
// TODO: Make UI drag and drop
