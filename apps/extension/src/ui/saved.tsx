import { type Group, ops, queries, type Tab } from "@shiba/core";
import { makePersisted } from "@solid-primitives/storage";
import { formatDistanceToNow } from "date-fns";
import {
    ExternalLink,
    Plus,
    RotateCcw,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-solid";
import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { webextTabs } from "../adapters/tabs";
import { Button } from "../lib/ui/button";
import { useShiba } from "../reactive/context";

const matches = (tab: Tab, q: string): boolean =>
    !q ||
    tab.title.toLowerCase().includes(q) ||
    tab.url.toLowerCase().includes(q);

export const SavedView: Component = () => {
    const store = useShiba();
    const [query, setQuery] = createSignal("");
    const [activeId, setActiveId] = makePersisted(createSignal(""), {
        storage: sessionStorage,
        name: "shiba.activeWorkspace",
    });

    const workspaces = createMemo(() => queries.liveWorkspaces(store.snap));
    const active = createMemo(
        () => workspaces().find((w) => w.id === activeId()) ?? workspaces()[0],
    );
    const groups = createMemo(() => {
        const ws = active();
        return ws ? queries.liveGroups(store.snap, ws.id, null) : [];
    });

    const saveCurrentWindow = async () => {
        const ws = active();
        if (!ws) return;
        const tabs = await webextTabs.queryCurrentWindow();
        store.commit((tx) =>
            ops.saveBrowserTabs(tx, store.deps, tabs, { workspaceId: ws.id }),
        );
    };

    const addWorkspace = () => {
        store.commit((tx) =>
            ops.createWorkspace(tx, store.deps, {
                name: `Workspace ${workspaces().length + 1}`,
            }),
        );
    };

    return (
        <div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
            <header class="flex items-center gap-2">
                <h1 class="mr-auto text-xl font-semibold">🐕 Shiba</h1>
                <Button size="sm" onClick={saveCurrentWindow}>
                    <Save class="h-4 w-4" /> Save window
                </Button>
            </header>

            <div class="flex items-center gap-2 rounded-md border border-input px-3">
                <Search class="h-4 w-4 text-muted-foreground" />
                <input
                    class="h-9 flex-1 bg-transparent text-sm outline-none"
                    placeholder="Search tabs…"
                    value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)}
                />
            </div>

            <nav class="flex flex-wrap items-center gap-1">
                <For each={workspaces()}>
                    {(ws) => (
                        <Button
                            variant={
                                ws.id === active()?.id ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => setActiveId(ws.id)}
                        >
                            {ws.name}
                        </Button>
                    )}
                </For>
                <Button
                    variant="ghost"
                    size="icon"
                    title="New workspace"
                    onClick={addWorkspace}
                >
                    <Plus class="h-4 w-4" />
                </Button>
            </nav>

            <Show
                when={groups().length > 0}
                fallback={
                    <p class="py-16 text-center text-muted-foreground">
                        No saved tabs yet. Hit “Save window” to stash your tabs.
                    </p>
                }
            >
                <For each={groups()}>
                    {(group) => (
                        <GroupCard
                            group={group}
                            query={query().toLowerCase()}
                        />
                    )}
                </For>
            </Show>
        </div>
    );
};

const GroupCard: Component<{ group: Group; query: string }> = (props) => {
    const store = useShiba();
    const [editing, setEditing] = createSignal(false);
    const tabs = createMemo(() =>
        queries
            .liveTabs(store.snap, props.group.id)
            .filter((t) => matches(t, props.query)),
    );

    const restoreAll = () => webextTabs.open(tabs().map((t) => t.url));
    const remove = () =>
        store.commit((tx) =>
            ops.softDelete(tx, store.deps, {
                kind: "group",
                id: props.group.id,
            }),
        );
    const rename = (name: string) =>
        store.commit((tx) =>
            ops.rename(
                tx,
                store.deps,
                { kind: "group", id: props.group.id },
                name,
            ),
        );

    return (
        <Show when={props.query === "" || tabs().length > 0}>
            <section class="rounded-lg border border-border bg-card">
                <div class="flex items-center gap-2 px-4 py-3">
                    <Show
                        when={editing()}
                        fallback={
                            <button
                                type="button"
                                class="mr-auto text-left font-medium"
                                onDblClick={() => setEditing(true)}
                            >
                                {props.group.name || "Untitled"}
                                <span class="ml-2 text-xs font-normal text-muted-foreground">
                                    {tabs().length} ·{" "}
                                    {formatDistanceToNow(props.group.savedAt, {
                                        addSuffix: true,
                                    })}
                                </span>
                            </button>
                        }
                    >
                        <input
                            class="mr-auto rounded border border-input bg-background px-2 py-1 text-sm outline-none"
                            autofocus
                            value={props.group.name ?? ""}
                            onBlur={(e) => {
                                rename(e.currentTarget.value.trim());
                                setEditing(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") setEditing(false);
                            }}
                        />
                    </Show>
                    <Button variant="ghost" size="sm" onClick={restoreAll}>
                        <RotateCcw class="h-4 w-4" /> Restore
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Delete list"
                        onClick={remove}
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
                <ul class="border-t border-border">
                    <For each={tabs()}>{(tab) => <TabRow tab={tab} />}</For>
                </ul>
            </section>
        </Show>
    );
};

const TabRow: Component<{ tab: Tab }> = (props) => {
    const store = useShiba();
    const remove = () =>
        store.commit((tx) =>
            ops.softDelete(tx, store.deps, { kind: "tab", id: props.tab.id }),
        );
    return (
        <li class="group flex items-center gap-2 px-4 py-1.5 hover:bg-accent/50">
            <Show
                when={props.tab.favicon}
                fallback={<div class="h-4 w-4 shrink-0 rounded bg-muted" />}
            >
                {(src) => (
                    <img
                        src={src()}
                        alt=""
                        class="h-4 w-4 shrink-0"
                        loading="lazy"
                    />
                )}
            </Show>
            <button
                type="button"
                class="flex-1 truncate text-left text-sm hover:underline"
                title={props.tab.url}
                onClick={() => webextTabs.focusOrOpen(props.tab.url)}
            >
                {props.tab.title}
            </button>
            <ExternalLink class="hidden h-3.5 w-3.5 text-muted-foreground group-hover:block" />
            <button
                type="button"
                class="text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                title="Remove tab"
                onClick={remove}
            >
                <X class="h-4 w-4" />
            </button>
        </li>
    );
};
