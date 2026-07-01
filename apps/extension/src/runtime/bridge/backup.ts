import { sendMessage } from "@/src/messaging/protocol";
import type { BackupSettings } from "@/src/runtime/settings";

/**
 * Page-side backup RPCs. These are plain `sendMessage` calls — no document port
 * required — so the Options page can drive backup/restore without mirroring the
 * whole document.
 */
export const listSnapshots = () => sendMessage("listSnapshots");
export const restoreSnapshot = (id: string) =>
    sendMessage("restoreSnapshot", id);
export const deleteSnapshot = (id: string) => sendMessage("deleteSnapshot", id);
export const captureSnapshot = () => sendMessage("captureSnapshot");
export const exportBackup = () => sendMessage("exportBackup");
export const importBackup = (json: string) => sendMessage("importBackup", json);
export const getBackupSettings = () => sendMessage("getBackupSettings");
export const setBackupSettings = (patch: Partial<BackupSettings>) =>
    sendMessage("setBackupSettings", patch);
