import { Check, CircleX, Loader } from "lucide-solid";
import type { Accessor, Component } from "solid-js";

// TODO: Implement with sync status

export type SyncStatus = "loading" | "success" | "error";
interface SyncStatusProps {
    status: Accessor<SyncStatus>;
}

const SyncStatus: Component<SyncStatusProps> = ({ status }) => {
    // TODO: Replace with animation

    const colourLoading = "text-blue-500";
    const colourSuccess = "text-green-500";
    const colourError = "text-red-500";
    return (
        <span
            class={
                `flex flex-row items-center space-x-2 text-xs"`
            }
            aria-label="Sync status"
        >
            <Switch fallback={<p>Unknown...</p>}>
                <Match when={status() === "loading"}>
                    {/* Blue */}
                    <p class={colourLoading}>Syncing...</p>
                    <Loader class={`animate-pulse h-4 w-4 ${colourLoading}`} />
                </Match>
                <Match when={status() === "success"}>
                    {/* Green */}
                    <p class={colourSuccess}>Up to date</p>
                    <Check class={colourSuccess} />
                </Match>
                <Match when={status() === "error"}>
                    {/* Red */}
                    <p class={colourError}>Sync errored</p>
                    <CircleX class={colourError} />
                </Match>
            </Switch>
        </span>
    );
};

export const StatusBar: Component = () => {
    // TODO: Hook signal in
    const [status, setStatus] = createSignal<"loading" | "success" | "error">(
        "success",
    );

    // const interval = setInterval(() => {
    //     switch (status()) {
    //         case "loading":
    //             setStatus("success");
    //             break;
    //         case "success":
    //             setStatus("error");
    //             break;
    //         case "error":
    //             setStatus("loading");
    //             break;
    //     }
    //   }, 1000);
    //   onCleanup(() => clearInterval(interval));

    return (
        // TODO: Display tabs saved here
        <div class="flex flex-row h-8 w-full items-center justify-between p-1 bg-zinc-300">
            <div class="flex-none">
                <p class="font-bold">Shiba</p>
            </div>
            {/* <div class="flex-grow" /> */}
            <div class="flex-none">
                <div class="flex flex-row space-x-4 items-center">
                    <p>{tabCount()} tabs saved</p>
                    <SyncStatus status={status} />
                </div>
            </div>
        </div>
    );
};
