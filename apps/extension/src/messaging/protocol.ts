import type { Command, CommandResult } from "@shiba/core";
import { defineExtensionMessaging } from "@webext-core/messaging";

/**
 * Page → worker RPC. The background worker owns the document; a page never
 * mutates directly — it sends a serializable {@link Command} and the worker
 * applies it centrally. (Bulk document state travels over {@link DOC_PORT}, not
 * here, so RPC payloads stay small.)
 */
export interface ProtocolMap {
    dispatch(cmd: Command): CommandResult;
}

export const { sendMessage, onMessage } =
    defineExtensionMessaging<ProtocolMap>();

/** Name of the long-lived port a page opens to mirror the document live. */
export const DOC_PORT = "shiba-doc";

/**
 * Frames the worker pushes down {@link DOC_PORT}. Byte payloads are base64 —
 * `runtime` messaging is not guaranteed to structured-clone typed arrays across
 * browsers, so we encode explicitly.
 */
export type DocPortMessage =
    | { t: "init"; deviceId: string; state: string }
    | { t: "update"; update: string };
