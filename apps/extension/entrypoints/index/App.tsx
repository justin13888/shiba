import type { Component } from "solid-js";

export const App: Component = () => {
    return (
        <main class="grid min-h-screen place-items-center bg-background text-foreground">
            <div class="space-y-1 text-center">
                <h1 class="text-2xl font-semibold">Shiba</h1>
                <p class="text-muted-foreground">
                    Tab manager — rebuilding on a sync-first core.
                </p>
            </div>
        </main>
    );
};
