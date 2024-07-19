import type { Component, JSX } from "solid-js";

// TODO: Implement with sync status

interface SyncStatusProps {
    status: "loading" | "success" | "error";
};

const SyncStatus: Component<SyncStatusProps> = ({status}) => { // TODO: Replace with animation
    return (
        <Switch fallback={<p>Sync status unknown...</p>}>
            <Match when={status === "loading"}>
                <p>Syncing...</p>
            </Match>
            <Match when={status === "success"}>
                <p>Up to date</p>
            </Match>
            <Match when={status === "error"}>
                <p>Sync errored</p>
            </Match>
        </Switch>
    )
}

export const StatusBar: Component = () => {
    // TODO: Hook signal in
    const [status, setStatus] = createSignal<"loading" | "success" | "error">("loading");

    return ( // TODO: Display tabs saved here
        <div class="flex flex-row h-8 w-full items-center justify-between p-1 bg-zinc-300">
            <div class="flex-none">
                <p class="font-bold">Shiba</p>
            </div>
            {/* <div class="flex-grow" /> */}
            <div class="flex-none">
                <SyncStatus status={status()} />
            </div>
        </div>
    )
};
