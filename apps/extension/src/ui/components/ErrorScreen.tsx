import { type Component, Show } from "solid-js";
import { Button } from "@/src/lib/ui/button";

/** Fallback rendered by an `ErrorBoundary` so a thrown error isn't a blank screen. */
export const ErrorScreen: Component<{
    error: unknown;
    onRetry?: () => void;
}> = (props) => (
    <div
        role="alert"
        class="grid min-h-screen place-items-center p-6 text-center"
    >
        <div class="max-w-sm space-y-3">
            <h1 class="text-lg font-semibold text-foreground">
                Something went wrong
            </h1>
            <p class="text-sm text-muted-foreground">
                {props.error instanceof Error
                    ? props.error.message
                    : "An unexpected error occurred."}
            </p>
            <Show when={props.onRetry}>
                <Button size="sm" onClick={() => props.onRetry?.()}>
                    Try again
                </Button>
            </Show>
        </div>
    </div>
);
