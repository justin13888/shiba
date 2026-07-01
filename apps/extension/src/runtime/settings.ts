import { browser } from "wxt/browser";

/**
 * Device-local backup preferences. Intentionally **not** synced — backups are a
 * per-device safety-net, so the toggle lives in `storage.local`, read by both the
 * worker's snapshot alarm and the Options UI.
 */
export interface BackupSettings {
    /** Default-on hourly local backup safety-net. */
    enabled: boolean;
}

const DEFAULTS: BackupSettings = { enabled: true };

export async function readBackupSettings(): Promise<BackupSettings> {
    const { backup } = await browser.storage.local.get("backup");
    return backup && typeof backup === "object"
        ? { ...DEFAULTS, ...(backup as Partial<BackupSettings>) }
        : DEFAULTS;
}

export async function writeBackupSettings(
    patch: Partial<BackupSettings>,
): Promise<BackupSettings> {
    const next = { ...(await readBackupSettings()), ...patch };
    await browser.storage.local.set({ backup: next });
    return next;
}
