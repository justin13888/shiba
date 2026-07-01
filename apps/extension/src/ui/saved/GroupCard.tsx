import { type Group, queries } from "@shiba/core";
import { formatDistanceToNow } from "date-fns";
import { Lock, Pencil, RotateCcw, Trash2 } from "lucide-solid";
import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { webextTabs } from "@/src/adapters/tabs";
import { Button } from "@/src/lib/ui/button";
import { useShiba } from "@/src/reactive/context";
import { useConfirm } from "@/src/ui/components/confirm";
import { matchesQuery } from "./match";
import { TabRow } from "./TabRow";

/** Cap initially-rendered rows so a huge group can't flood the DOM; reveal on demand. */
const TAB_CAP = 100;

/**
 * A saved group. Rename is an explicit, keyboard-reachable action (not a
 * hidden double-click): the button swaps the heading for a labelled input that
 * commits on Enter/blur and cancels on Escape, returning focus to the trigger.
 * Restore-all opens the tabs; delete is confirmed and honours the locked flag.
 */
export const GroupCard: Component<{ group: Group; query: string }> = (
    props,
) => {
    const store = useShiba();
    const confirm = useConfirm();
    const [editing, setEditing] = createSignal(false);
    const [expanded, setExpanded] = createSignal(false);
    let renameButton: HTMLButtonElement | undefined;

    const tabs = createMemo(() =>
        queries
            .liveTabs(store.snap, props.group.id)
            .filter((t) => matchesQuery(t, props.query)),
    );
    const shownTabs = createMemo(() =>
        expanded() ? tabs() : tabs().slice(0, TAB_CAP),
    );
    const title = (): string => props.group.name || "Untitled";

    // Restore is the inverse of "Save window" (stash + close): once the tabs are
    // back in the browser the stash is spent, so clear the group. We open *all*
    // the group's tabs — not just the search-filtered view — and only clear after
    // the open resolves, so a failed open keeps the stash intact. A locked group
    // resists deletion (data-model.md), so it reopens but is left in place.
    const restoreAll = async (): Promise<void> => {
        const all = queries.liveTabs(store.snap, props.group.id);
        if (all.length === 0) return;
        await webextTabs.open(all.map((t) => t.url));
        if (props.group.locked) return;
        await store.dispatch({
            type: "softDelete",
            ref: { kind: "group", id: props.group.id },
        });
    };
    const rename = (name: string): void =>
        void store.dispatch({
            type: "rename",
            ref: { kind: "group", id: props.group.id },
            name,
        });
    const remove = async (): Promise<void> => {
        const ok = await confirm({
            title: `Delete "${title()}"?`,
            description: `Its ${tabs().length} tab(s) move to Trash — you can undo this there.`,
            confirmLabel: "Delete",
            destructive: true,
        });
        if (ok)
            void store.dispatch({
                type: "softDelete",
                ref: { kind: "group", id: props.group.id },
            });
    };
    const cancelEdit = (): void => {
        setEditing(false);
        renameButton?.focus();
    };

    return (
        <section
            class="rounded-lg border border-border bg-card"
            aria-label={title()}
        >
            <div class="flex items-center gap-2 px-4 py-3">
                <Show
                    when={editing()}
                    fallback={
                        <div class="mr-auto flex items-center gap-1.5">
                            <h3 class="font-medium">{title()}</h3>
                            <Show when={props.group.locked}>
                                <Lock
                                    class="h-3 w-3 text-muted-foreground"
                                    aria-label="Locked"
                                />
                            </Show>
                            <span class="text-xs font-normal text-muted-foreground">
                                {tabs().length} ·{" "}
                                {formatDistanceToNow(props.group.savedAt, {
                                    addSuffix: true,
                                })}
                            </span>
                        </div>
                    }
                >
                    <input
                        class="mr-auto rounded border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Group name"
                        ref={(el) => queueMicrotask(() => el.focus())}
                        value={props.group.name ?? ""}
                        onBlur={(e) => {
                            rename(e.currentTarget.value.trim());
                            setEditing(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") cancelEdit();
                        }}
                    />
                </Show>
                <Button
                    ref={renameButton}
                    variant="ghost"
                    size="icon"
                    aria-label="Rename group"
                    onClick={() => setEditing(true)}
                >
                    <Pencil class="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void restoreAll()}
                >
                    <RotateCcw class="h-4 w-4" /> Restore
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete group"
                    onClick={() => void remove()}
                >
                    <Trash2 class="h-4 w-4" />
                </Button>
            </div>
            <ul class="border-t border-border">
                <For each={shownTabs()}>{(tab) => <TabRow tab={tab} />}</For>
                <Show when={tabs().length > TAB_CAP && !expanded()}>
                    <li class="px-4 py-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpanded(true)}
                        >
                            Show {tabs().length - TAB_CAP} more
                        </Button>
                    </li>
                </Show>
            </ul>
        </section>
    );
};
