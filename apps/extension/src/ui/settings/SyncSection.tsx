import { formatDistanceToNow } from "date-fns";
import {
    type Component,
    createSignal,
    onCleanup,
    onMount,
    Show,
} from "solid-js";
import { browser } from "wxt/browser";
import { Button } from "@/src/lib/ui/button";
import { getSyncStatus } from "@/src/runtime/bridge/sync";
import {
    disconnectSync,
    isSyncReady,
    type SyncStatus,
    setupSync,
} from "@/src/runtime/sync";

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

const dotClass = (s: SyncStatus): string => {
    if (s.status === "online") return "bg-green-500";
    if (s.status === "connecting") return "bg-amber-500";
    return "bg-red-500";
};

const statusLabel = (s: SyncStatus): string => {
    if (s.status === "online") return "Active";
    if (s.status === "connecting") return "Connecting…";
    return s.lastOnlineAt
        ? `Inaccessible — last active ${formatDistanceToNow(s.lastOnlineAt, {
              addSuffix: true,
          })}`
        : "Inaccessible";
};

/**
 * Device pairing + encryption unlock. When unpaired, a real `<form>` (Enter
 * submits) with a `url` field and a show/hide toggle for the secrets. Once
 * paired, the form is replaced by a live status line (Active / Inaccessible) and
 * a Disconnect button — the two states are mutually exclusive. Pairing writes
 * storage; the worker reconnects on its own (no reload).
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
    const [ready, setReady] = createSignal(false);
    const [sync, setSync] = createSignal<SyncStatus>({
        status: "offline",
        lastOnlineAt: null,
    });

    const refreshReady = async (): Promise<void> => {
        setReady(await isSyncReady());
    };
    const refreshStatus = async (): Promise<void> => {
        try {
            setSync(await getSyncStatus());
        } catch {
            // Worker not ready yet; keep the last known status.
        }
    };

    onMount(() => {
        void refreshReady();
        void refreshStatus();
        // Poll so the indicator (and its relative "last active" time) stays live
        // while the Options page is open.
        const timer = setInterval(() => {
            void refreshReady();
            void refreshStatus();
        }, 4000);
        // React immediately when pairing state changes in any context.
        const onChanged = (
            changes: Record<string, unknown>,
            area: string,
        ): void => {
            if (
                (area === "local" && changes.syncConfig) ||
                (area === "session" && changes.dek)
            ) {
                void refreshReady();
                void refreshStatus();
            }
        };
        browser.storage.onChanged.addListener(onChanged);
        onCleanup(() => {
            clearInterval(timer);
            browser.storage.onChanged.removeListener(onChanged);
        });
    });

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
            await refreshReady();
            await refreshStatus();
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
        await refreshReady();
        await refreshStatus();
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

            <Show
                when={ready()}
                fallback={
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
                                onChange={(e) =>
                                    setReveal(e.currentTarget.checked)
                                }
                            />
                            Show secret and passphrase
                        </label>
                        <Button type="submit" disabled={busy()}>
                            {busy() ? "Connecting…" : "Connect"}
                        </Button>
                    </form>
                }
            >
                <div class="space-y-3">
                    <p
                        class="flex items-center gap-2 text-sm"
                        aria-live="polite"
                    >
                        <span
                            class={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass(
                                sync(),
                            )}`}
                            aria-hidden="true"
                        />
                        <span>{statusLabel(sync())}</span>
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void disconnect()}
                    >
                        Disconnect
                    </Button>
                </div>
            </Show>

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
