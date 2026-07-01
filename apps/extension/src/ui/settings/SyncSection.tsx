import { type Component, createSignal, Show } from "solid-js";
import { Button } from "@/src/lib/ui/button";
import { disconnectSync, setupSync } from "@/src/runtime/sync";

const Field: Component<{
    label: string;
    type?: string;
    value: string;
    placeholder?: string;
    onInput: (value: string) => void;
}> = (props) => (
    <label class="block space-y-1">
        <span class="text-sm font-medium">{props.label}</span>
        <input
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type={props.type ?? "text"}
            value={props.value}
            placeholder={props.placeholder}
            onInput={(e) => props.onInput(e.currentTarget.value)}
        />
    </label>
);

/**
 * Device pairing + encryption unlock. A real `<form>` (Enter submits), a `url`
 * field, a show/hide toggle for the secrets, and an `aria-live` status so screen
 * readers hear the result. Pairing writes storage; the worker reconnects on its
 * own (no reload).
 */
export const SyncSection: Component = () => {
    const [serverUrl, setServerUrl] = createSignal("");
    const [serverSecret, setServerSecret] = createSignal("");
    const [passphrase, setPassphrase] = createSignal("");
    const [reveal, setReveal] = createSignal(false);
    const [busy, setBusy] = createSignal(false);
    const [status, setStatus] = createSignal<{
        ok: boolean;
        message: string;
    }>();

    const connect = async (event: Event): Promise<void> => {
        event.preventDefault();
        setBusy(true);
        setStatus(undefined);
        try {
            await setupSync({
                serverUrl: serverUrl(),
                serverSecret: serverSecret(),
                passphrase: passphrase(),
            });
            setStatus({ ok: true, message: "Connected. Syncing is active." });
            setServerSecret("");
            setPassphrase("");
        } catch (error) {
            setStatus({
                ok: false,
                message:
                    error instanceof Error ? error.message : "Setup failed.",
            });
        } finally {
            setBusy(false);
        }
    };

    const disconnect = async (): Promise<void> => {
        await disconnectSync();
        setStatus({ ok: true, message: "Disconnected from sync." });
    };

    return (
        <section class="space-y-4" aria-labelledby="sync-heading">
            <header class="space-y-1">
                <h2 id="sync-heading" class="text-lg font-semibold">
                    Sync
                </h2>
                <p class="text-sm text-muted-foreground">
                    End-to-end encrypted. Your passphrase never leaves this
                    device.
                </p>
            </header>

            <form class="space-y-4" onSubmit={connect}>
                <Field
                    label="Server URL"
                    type="url"
                    value={serverUrl()}
                    onInput={setServerUrl}
                    placeholder="https://sync.example.com"
                />
                <Field
                    label="Server secret"
                    type={reveal() ? "text" : "password"}
                    value={serverSecret()}
                    onInput={setServerSecret}
                    placeholder="SHIBA_SERVER_SECRET"
                />
                <Field
                    label="Encryption passphrase"
                    type={reveal() ? "text" : "password"}
                    value={passphrase()}
                    onInput={setPassphrase}
                    placeholder="A strong passphrase you'll remember"
                />
                <label class="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        class="h-4 w-4"
                        checked={reveal()}
                        onChange={(e) => setReveal(e.currentTarget.checked)}
                    />
                    Show secret and passphrase
                </label>
                <div class="flex gap-2">
                    <Button type="submit" disabled={busy()}>
                        {busy() ? "Connecting…" : "Connect"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void disconnect()}
                    >
                        Disconnect
                    </Button>
                </div>
            </form>

            <p class="min-h-5 text-sm" aria-live="polite">
                <Show when={status()}>
                    {(s) => (
                        <span
                            class={
                                s().ok
                                    ? "text-muted-foreground"
                                    : "text-destructive"
                            }
                        >
                            {s().message}
                        </span>
                    )}
                </Show>
            </p>
        </section>
    );
};
