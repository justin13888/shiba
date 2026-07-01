import { Tabs } from "@kobalte/core/tabs";
import { queries } from "@shiba/core";
import { makePersisted } from "@solid-primitives/storage";
import { Plus, Save, Search, Trash2 } from "lucide-solid";
import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { webextTabs } from "@/src/adapters/tabs";
import { Button } from "@/src/lib/ui/button";
import { useShiba } from "@/src/reactive/context";
import { GroupCard } from "./GroupCard";
import { matchesQuery } from "./match";
import { TrashDialog } from "./TrashDialog";

const Empty: Component<{ message: string }> = (props) => (
    <p class="py-16 text-center text-muted-foreground">{props.message}</p>
);

const GroupList: Component<{ workspaceId: string; query: string }> = (
    props,
) => {
    const store = useShiba();
    const q = createMemo(() => props.query.trim().toLowerCase());
    const groups = createMemo(() =>
        queries.liveGroups(store.snap, props.workspaceId, null),
    );
    const visible = createMemo(() =>
        q() === ""
            ? groups()
            : groups().filter((g) =>
                  queries
                      .liveTabs(store.snap, g.id)
                      .some((t) => matchesQuery(t, q())),
              ),
    );

    return (
        <Show
            when={groups().length > 0}
            fallback={
                <Empty message="No saved tabs yet. Hit “Save window” to stash your tabs." />
            }
        >
            <Show
                when={visible().length > 0}
                fallback={<Empty message={`No tabs match “${props.query}”.`} />}
            >
                <div class="flex flex-col gap-4">
                    <For each={visible()}>
                        {(group) => <GroupCard group={group} query={q()} />}
                    </For>
                </div>
            </Show>
        </Show>
    );
};

export const SavedView: Component = () => {
    const store = useShiba();
    const [query, setQuery] = createSignal("");
    const [trashOpen, setTrashOpen] = createSignal(false);
    const [activeId, setActiveId] = makePersisted(createSignal(""), {
        storage: sessionStorage,
        name: "shiba.activeWorkspace",
    });

    const workspaces = createMemo(() => queries.liveWorkspaces(store.snap));
    const active = createMemo(
        () => workspaces().find((w) => w.id === activeId()) ?? workspaces()[0],
    );

    const saveCurrentWindow = async (): Promise<void> => {
        const ws = active();
        if (!ws) return;
        const tabs = await webextTabs.queryCurrentWindow();
        await store.dispatch({
            type: "saveBrowserTabs",
            tabs,
            options: { workspaceId: ws.id },
        });
    };
    const addWorkspace = (): void =>
        void store.dispatch({
            type: "createWorkspace",
            input: { name: `Workspace ${workspaces().length + 1}` },
        });

    return (
        <div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
            <header class="flex items-center gap-2">
                <h1 class="mr-auto text-xl font-semibold">🐕 Shiba</h1>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTrashOpen(true)}
                >
                    <Trash2 class="h-4 w-4" /> Trash
                </Button>
                <Button size="sm" onClick={() => void saveCurrentWindow()}>
                    <Save class="h-4 w-4" /> Save window
                </Button>
            </header>
            <TrashDialog open={trashOpen()} onOpenChange={setTrashOpen} />

            <div class="flex items-center gap-2 rounded-md border border-input px-3 focus-within:ring-2 focus-within:ring-ring">
                <Search
                    class="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    class="h-9 flex-1 bg-transparent text-sm outline-none"
                    placeholder="Search tabs…"
                    aria-label="Search tabs"
                    value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)}
                />
            </div>

            <Show
                when={workspaces().length > 0}
                fallback={<Empty message="Loading your workspaces…" />}
            >
                <Tabs
                    value={active()?.id}
                    onChange={setActiveId}
                    class="flex flex-col gap-4"
                >
                    <div class="flex items-center gap-1">
                        <Tabs.List
                            class="flex flex-1 flex-wrap items-center gap-1"
                            aria-label="Workspaces"
                        >
                            <For each={workspaces()}>
                                {(ws) => (
                                    <Tabs.Trigger
                                        value={ws.id}
                                        class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected]:bg-primary data-[selected]:text-primary-foreground"
                                    >
                                        {ws.name}
                                    </Tabs.Trigger>
                                )}
                            </For>
                        </Tabs.List>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="New workspace"
                            onClick={addWorkspace}
                        >
                            <Plus class="h-4 w-4" />
                        </Button>
                    </div>
                    <For each={workspaces()}>
                        {(ws) => (
                            <Tabs.Content value={ws.id}>
                                <GroupList
                                    workspaceId={ws.id}
                                    query={query()}
                                />
                            </Tabs.Content>
                        )}
                    </For>
                </Tabs>
            </Show>
        </div>
    );
};
