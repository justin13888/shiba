import { sendMessage } from "@/src/messaging/protocol";

/**
 * Page-side sync RPC. A plain `sendMessage` — the worker owns the sync engine
 * and its connection status, so the Options page just asks for the latest.
 */
export const getSyncStatus = () => sendMessage("getSyncStatus");
