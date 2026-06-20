import type { ClientMessage, ServerMessage } from "@shiba/sync-protocol";
import type { Unsubscribe } from "./crdt";

export type ConnectionStatus = "offline" | "connecting" | "online" | "error";

/**
 * A bidirectional channel to the sync server. Hides the concrete transport
 * (WebSocket) so the {@link import("../sync/engine").SyncEngine} can be tested
 * over an in-memory loopback.
 */
export interface SyncTransport {
    connect(token: string): Promise<void>;
    disconnect(): void;
    send(message: ClientMessage): void;
    onMessage(handler: (message: ServerMessage) => void): Unsubscribe;
    onStatus(handler: (status: ConnectionStatus) => void): Unsubscribe;
}
