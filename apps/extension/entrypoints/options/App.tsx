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

export const App: Component = () => {
    const [serverUrl, setServerUrl] = createSignal("");
    const [serverSecret, setServerSecret] = createSignal("");
    const [passphrase, setPassphrase] = createSignal("");
    const [busy, setBusy] = createSignal(false);
    const [status, setStatus] = createSignal<{
        ok: boolean;
        message: string;
    }>();

    const connect = async () => {
        setBusy(true);
        setStatus(undefined);
        try {
            await setupSync({
                serverUrl: serverUrl(),
                serverSecret: serverSecret(),
                passphrase: passphrase(),
            });
            setStatus({
                ok: true,
                message: "Connected. Reload Shiba to start syncing.",
            });
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

    const disconnect = async () => {
        await disconnectSync();
        setStatus({ ok: true, message: "Disconnected from sync." });
    };

    return (
        <main class="mx-auto max-w-md space-y-5 bg-background p-6 text-foreground">
            <header class="space-y-1">
                <h1 class="text-lg font-semibold">🐕 Shiba — Sync</h1>
                <p class="text-sm text-muted-foreground">
                    End-to-end encrypted. Your passphrase never leaves this
                    device.
                </p>
            </header>
            <Field
                label="Server URL"
                value={serverUrl()}
                onInput={setServerUrl}
                placeholder="https://sync.example.com"
            />
            <Field
                label="Server secret"
                type="password"
                value={serverSecret()}
                onInput={setServerSecret}
                placeholder="SHIBA_SERVER_SECRET"
            />
            <Field
                label="Encryption passphrase"
                type="password"
                value={passphrase()}
                onInput={setPassphrase}
                placeholder="A strong passphrase you'll remember"
            />
            <div class="flex gap-2">
                <Button onClick={connect} disabled={busy()}>
                    {busy() ? "Connecting…" : "Connect"}
                </Button>
                <Button variant="outline" onClick={disconnect}>
                    Disconnect
                </Button>
            </div>
            <Show when={status()}>
                {(s) => (
                    <p
                        class={
                            s().ok
                                ? "text-sm text-muted-foreground"
                                : "text-sm text-destructive"
                        }
                    >
                        {s().message}
                    </p>
                )}
            </Show>
        </main>
    );
};
