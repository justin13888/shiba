import { formatDistanceToNow } from "date-fns";
import { Archive, Download, RotateCcw, Trash2, Upload } from "lucide-solid";
import {
    type Component,
    createResource,
    createSignal,
    For,
    Show,
} from "solid-js";
import { Button } from "@/src/lib/ui/button";
import {
    captureSnapshot,
    deleteSnapshot,
    exportBackup,
    getBackupSettings,
    importBackup,
    listSnapshots,
    restoreSnapshot,
    setBackupSettings,
} from "@/src/runtime/bridge/backup";
import { Switch } from "@/src/ui/components/Switch";

function downloadJson(name: string, text: string): void {
    const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
}

/**
 * The device-local backup safety-net UI: toggle the default-on hourly capture,
 * browse/restore/delete snapshots, force a capture, and export/import a portable
 * `.shiba.json`. Restore and import are non-destructive (new workspaces).
 */
export const BackupSection: Component = () => {
    const [snapshots, { refetch }] = createResource(listSnapshots);
    const [settings, { mutate: mutateSettings }] =
        createResource(getBackupSettings);
    const [status, setStatus] = createSignal("");
    const [busy, setBusy] = createSignal(false);
    let fileInput: HTMLInputElement | undefined;

    const withBusy = async (fn: () => Promise<void>): Promise<void> => {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    };

    const toggle = (enabled: boolean) =>
        withBusy(async () => {
            mutateSettings(await setBackupSettings({ enabled }));
            setStatus(
                enabled
                    ? "Automatic hourly backups on."
                    : "Automatic backups off — you can still snapshot manually.",
            );
        });

    const snapshotNow = () =>
        withBusy(async () => {
            const captured = await captureSnapshot();
            setStatus(
                captured
                    ? "Snapshot captured."
                    : "No changes since the last snapshot.",
            );
            await refetch();
        });

    const restore = (id: string) =>
        withBusy(async () => {
            const result = await restoreSnapshot(id);
            setStatus(
                result
                    ? "Restored into a new workspace. Open Shiba to review it."
                    : "That snapshot is no longer available.",
            );
        });

    const remove = (id: string) =>
        withBusy(async () => {
            await deleteSnapshot(id);
            setStatus("Snapshot deleted.");
            await refetch();
        });

    const doExport = () =>
        withBusy(async () => {
            const date = new Date().toISOString().slice(0, 10);
            downloadJson(`shiba-backup-${date}.json`, await exportBackup());
            setStatus("Backup exported.");
        });

    const onImport = (event: Event & { currentTarget: HTMLInputElement }) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        void withBusy(async () => {
            try {
                await importBackup(await file.text());
                setStatus("Imported into a new workspace.");
            } catch {
                setStatus("That file isn't a valid Shiba backup.");
            }
        });
    };

    return (
        <section class="space-y-4" aria-labelledby="backup-heading">
            <header class="space-y-1">
                <h2 id="backup-heading" class="text-lg font-semibold">
                    Local backups
                </h2>
                <p class="text-sm text-muted-foreground">
                    An automatic on-device safety-net. Snapshots stay on this
                    device and are kept for one week. Restoring never overwrites
                    your data — it adds a new workspace.
                </p>
            </header>

            <Switch
                checked={settings()?.enabled ?? true}
                disabled={busy() || settings.loading}
                onChange={(checked) => void toggle(checked)}
                label="Automatically snapshot hourly when something changes"
            />

            <div class="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void snapshotNow()}
                    disabled={busy()}
                >
                    <Archive class="h-4 w-4" /> Snapshot now
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void doExport()}
                    disabled={busy()}
                >
                    <Download class="h-4 w-4" /> Export…
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInput?.click()}
                    disabled={busy()}
                >
                    <Upload class="h-4 w-4" /> Import…
                </Button>
                <input
                    ref={fileInput}
                    type="file"
                    accept="application/json,.json"
                    class="sr-only"
                    tabindex={-1}
                    onChange={onImport}
                />
            </div>

            <p class="min-h-5 text-sm text-muted-foreground" aria-live="polite">
                {status()}
            </p>

            <Show
                when={(snapshots()?.length ?? 0) > 0}
                fallback={
                    <p class="text-sm text-muted-foreground">
                        No snapshots yet.
                    </p>
                }
            >
                <ul class="divide-y divide-border rounded-md border border-border">
                    <For each={snapshots()}>
                        {(snap) => (
                            <li class="flex items-center gap-3 px-3 py-2 text-sm">
                                <div class="mr-auto">
                                    <div class="font-medium">
                                        {formatDistanceToNow(snap.createdAt, {
                                            addSuffix: true,
                                        })}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {snap.tabCount} tabs · {snap.groupCount}{" "}
                                        groups
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void restore(snap.id)}
                                    disabled={busy()}
                                >
                                    <RotateCcw class="h-4 w-4" /> Restore
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Delete snapshot"
                                    onClick={() => void remove(snap.id)}
                                    disabled={busy()}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </section>
    );
};
