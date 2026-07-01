import type { Tab } from "@shiba/core";
import { ExternalLink, X } from "lucide-solid";
import { type Component, Show } from "solid-js";
import { webextTabs } from "@/src/adapters/tabs";
import { useShiba } from "@/src/reactive/context";
import { useConfirm } from "@/src/ui/components/confirm";

/**
 * One saved tab. The title is a real `<a href>` (so middle/ctrl-click, "copy link",
 * and open-in-new-tab all work); a plain click is intercepted to focus-or-open in
 * place. Row actions reveal on hover *and* keyboard focus, and deletion is
 * confirmed rather than silent.
 */
export const TabRow: Component<{ tab: Tab }> = (props) => {
    const store = useShiba();
    const confirm = useConfirm();

    const open = (event: MouseEvent): void => {
        // Let modified / non-primary clicks use native link behaviour.
        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.button !== 0
        )
            return;
        event.preventDefault();
        void webextTabs.focusOrOpen(props.tab.url);
    };

    const remove = async (): Promise<void> => {
        const ok = await confirm({
            title: "Remove tab?",
            description: props.tab.title,
            confirmLabel: "Remove",
            destructive: true,
        });
        if (ok)
            void store.dispatch({
                type: "softDelete",
                ref: { kind: "tab", id: props.tab.id },
            });
    };

    return (
        <li class="group flex items-center gap-2 px-4 py-1.5 hover:bg-accent/50 focus-within:bg-accent/50">
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
            <a
                href={props.tab.url}
                onClick={open}
                class="flex-1 truncate rounded text-left text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {props.tab.title}
                <span class="sr-only"> — {props.tab.url}</span>
            </a>
            <ExternalLink
                class="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:block group-focus-within:block"
                aria-hidden="true"
            />
            <button
                type="button"
                class="shrink-0 rounded text-muted-foreground opacity-0 transition hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                aria-label={`Remove ${props.tab.title}`}
                onClick={() => void remove()}
            >
                <X class="h-4 w-4" />
            </button>
        </li>
    );
};
