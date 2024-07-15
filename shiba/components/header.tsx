import { tabCount } from "@/utils/store";
import type { Component } from "solid-js";

// TODO: Finish implementation
export const Header: Component = () => {
    return (
        <>
            <div class="flex flex-row items-baseline space-x-4 pb-4">
                <p class="text-4xl font-extrabold">Shiba</p>
                {/* TODO: Replace fallback with loading animation */}
                <Show
                    when={tabCount.state === "ready"}
                    fallback={<p>Loading...</p>}
                >
                    <p class="text-xl">{tabCount()} Tabs Saved</p>
                </Show>
            </div>
        </>
    );
};
