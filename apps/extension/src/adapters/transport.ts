import type { ConnectionStatus, SyncTransport } from "@shiba/core";
import { type ClientMessage, parseServerMessage } from "@shiba/sync-protocol";

/** {@link SyncTransport} over a browser WebSocket, with automatic reconnect. */
export function createWsTransport(serverUrl: string): SyncTransport {
    let socket: WebSocket | null = null;
    let token = "";
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const messageHandlers = new Set<
        (m: import("@shiba/sync-protocol").ServerMessage) => void
    >();
    const statusHandlers = new Set<(s: ConnectionStatus) => void>();

    const emit = (status: ConnectionStatus) => {
        for (const h of statusHandlers) h(status);
    };

    const endpoint = (): string => {
        const url = new URL(serverUrl.replace(/^http/, "ws"));
        url.pathname = "/sync";
        url.searchParams.set("token", token);
        return url.toString();
    };

    const open = (): void => {
        emit("connecting");
        socket = new WebSocket(endpoint());
        socket.onopen = () => emit("online");
        socket.onmessage = (event) => {
            try {
                const message = parseServerMessage(String(event.data));
                for (const h of messageHandlers) h(message);
            } catch {
                // ignore malformed frames
            }
        };
        socket.onerror = () => emit("error");
        socket.onclose = () => {
            emit("offline");
            if (!closed) retry = setTimeout(open, 2000);
        };
    };

    return {
        connect(t) {
            token = t;
            closed = false;
            open();
            return Promise.resolve();
        },
        disconnect() {
            closed = true;
            clearTimeout(retry);
            socket?.close();
        },
        send(message: ClientMessage) {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        },
        onMessage(handler) {
            messageHandlers.add(handler);
            return () => messageHandlers.delete(handler);
        },
        onStatus(handler) {
            statusHandlers.add(handler);
            return () => statusHandlers.delete(handler);
        },
    };
}
