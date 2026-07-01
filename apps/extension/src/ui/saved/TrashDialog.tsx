import { Dialog } from "@kobalte/core/dialog";
import { type EntityRef, queries } from "@shiba/core";
import { RotateCcw, X } from "lucide-solid";
import { type Component, createMemo, For, Show } from "solid-js";
import { Button } from "@/src/lib/ui/button";
import { useShiba } from "@/src/reactive/context";

interface TrashRow {
    id: string;
    name: string;
}
interface TrashSection {
    label: string;
    kind: EntityRef["kind"];
    rows: TrashRow[];
}

/** A trashed-items browser with per-item restore — the undo path for deletions. */
export const TrashDialog: Component<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}> = (props) => {
    const store = useShiba();

    const sections = createMemo<TrashSection[]>(() => {
        const t = queries.trashed(store.snap);
        return [
            {
                label: "Workspaces",
                kind: "workspace" as const,
                rows: t.workspaces.map((w) => ({ id: w.id, name: w.name })),
            },
            {
                label: "Folders",
                kind: "folder" as const,
                rows: t.folders.map((f) => ({ id: f.id, name: f.name })),
            },
            {
                label: "Groups",
                kind: "group" as const,
                rows: t.groups.map((g) => ({
                    id: g.id,
                    name: g.name || "Untitled",
                })),
            },
            {
                label: "Tabs",
                kind: "tab" as const,
                rows: t.tabs.map((tab) => ({ id: tab.id, name: tab.title })),
            },
        ].filter((section) => section.rows.length > 0);
    });

    const restore = (kind: EntityRef["kind"], id: string): void =>
        void store.dispatch({ type: "restore", ref: { kind, id } });

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-50 bg-black/40" />
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Content class="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-lg">
                        <div class="flex items-center gap-2 border-b border-border px-4 py-3">
                            <Dialog.Title class="mr-auto text-base font-semibold text-foreground">
                                Trash
                            </Dialog.Title>
                            <Dialog.CloseButton
                                class="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Close trash"
                            >
                                <X class="h-4 w-4" />
                            </Dialog.CloseButton>
                        </div>
                        <div class="space-y-4 overflow-y-auto p-4">
                            <Show
                                when={sections().length > 0}
                                fallback={
                                    <p class="py-8 text-center text-sm text-muted-foreground">
                                        Trash is empty.
                                    </p>
                                }
                            >
                                <For each={sections()}>
                                    {(section) => (
                                        <div class="space-y-1">
                                            <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {section.label}
                                            </h3>
                                            <ul class="divide-y divide-border rounded-md border border-border">
                                                <For each={section.rows}>
                                                    {(row) => (
                                                        <li class="flex items-center gap-2 px-3 py-1.5 text-sm">
                                                            <span class="mr-auto truncate">
                                                                {row.name}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    restore(
                                                                        section.kind,
                                                                        row.id,
                                                                    )
                                                                }
                                                            >
                                                                <RotateCcw class="h-3.5 w-3.5" />{" "}
                                                                Restore
                                                            </Button>
                                                        </li>
                                                    )}
                                                </For>
                                            </ul>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    );
};
