import { Button } from "@/components/ui/button";
import { TextField, TextFieldRoot } from "@/components/ui/text-field";
import { cn } from "@/utils";
import { useSearchParams } from "@solidjs/router";
import { createQuery } from "@tanstack/solid-query";
import { debounce } from "lodash";
import { Search } from "lucide-solid";
import {
    For,
    type JSX,
    Match,
    Show,
    Switch,
    createEffect,
    createSignal,
    onCleanup,
} from "solid-js";
import { Motion, Presence } from "solid-motionone";

const normalizeSearchTerm = (term: string) => term.trim().toLowerCase();

export function SearchBar() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = createSignal(searchParams.search || "");
    const updateSearch = (value: string) => {
        setSearch(normalizeSearchTerm(value));
    };
    const [showSuggestions, setShowSuggestions] = createSignal(false);
    const [activeSuggestion, setActiveSuggestion] = createSignal(-1);
    let inputRef!: HTMLInputElement;

    const fetchSuggestions = async (query: string) => {
        // TODO: Implement
        const suggestions = [
            "React",
            "Next.js",
            "TypeScript",
            "TailwindCSS",
            "Framer Motion",
            "shadcn/ui",
        ];
        return suggestions.filter((suggestion) =>
            suggestion.toLowerCase().includes(query.toLowerCase()),
        );
    };

    const suggestionsQuery = createQuery(() => ({
        queryKey: ["suggestions", search()],
        queryFn: () => fetchSuggestions(search()),
        enabled: search().length > 0,
    }));

    const handleInputChange: JSX.ChangeEventHandlerUnion<
        HTMLInputElement,
        Event
    > = debounce((e) => {
        updateSearch(e.target.value);
        // Store search term in URL but maintain case
        setSearchParams({
            search: e.target.value,
        });
        setShowSuggestions(true);
        setActiveSuggestion(-1);
    }, 100);

    const handleSuggestionClick = (suggestion: string) => {
        updateSearch(suggestion);
        setShowSuggestions(false);
        inputRef.focus();
    };

    const handleKeyDown: JSX.EventHandlerUnion<
        HTMLInputElement,
        KeyboardEvent
    > = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (suggestionsQuery.data) {
                setActiveSuggestion((prev) =>
                    prev < suggestionsQuery.data.length - 1 ? prev + 1 : prev,
                );
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && activeSuggestion() !== -1) {
            if (suggestionsQuery.data) {
                updateSearch(suggestionsQuery.data[activeSuggestion()]);
            }
            setShowSuggestions(false);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        } else {
            updateSearch(e.currentTarget.value);
        }
    };

    createEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef &&
                event.target &&
                !inputRef.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    });

    // TODO: There's still some state issues with the dropdown when you change the search term to something entered before
    return (
        <TextFieldRoot>
            <form
                class="relative w-full max-w-sm"
                onSubmit={(e) => e.preventDefault()}
            >
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <TextField
                    ref={inputRef}
                    type="search"
                    placeholder="Search..."
                    class="pl-8 w-full"
                    value={search()}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                    aria-expanded={showSuggestions()}
                />
                <Presence>
                    <Show when={showSuggestions()}>
                        <Switch fallback={<div>Loading...</div>}>
                            <Match when={suggestionsQuery.isSuccess}>
                                <Show
                                    when={suggestionsQuery.data}
                                    fallback={<div>No suggestions found</div>}
                                >
                                    {(filteredSuggestions) => (
                                        <Show
                                            when={
                                                filteredSuggestions().length > 0
                                            }
                                            // TODO: This fallback causes layout shift
                                            fallback={
                                                <Motion.span>
                                                    No suggestions...
                                                </Motion.span>
                                            }
                                        >
                                            <Motion.ul
                                                id="search-suggestions"
                                                class="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <For
                                                    each={filteredSuggestions()}
                                                >
                                                    {(suggestion, index) => (
                                                        <Motion.li
                                                            initial={{
                                                                opacity: 0,
                                                                y: -10,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.1,
                                                                delay:
                                                                    index() *
                                                                    0.05,
                                                            }}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                class={cn(
                                                                    "w-full justify-start rounded-none",
                                                                    index() ===
                                                                    activeSuggestion() &&
                                                                    "bg-accent",
                                                                )}
                                                                onClick={() =>
                                                                    handleSuggestionClick(
                                                                        suggestion,
                                                                    )
                                                                }
                                                            >
                                                                {suggestion}
                                                            </Button>
                                                        </Motion.li>
                                                    )}
                                                </For>
                                            </Motion.ul>
                                        </Show>
                                    )}
                                </Show>
                            </Match>
                            <Match when={suggestionsQuery.isError}>
                                <div>
                                    Error:{" "}
                                    {suggestionsQuery.error?.message ||
                                        "unknown"}
                                </div>
                            </Match>
                        </Switch>
                    </Show>
                </Presence>
            </form>
        </TextFieldRoot>
    );
}
