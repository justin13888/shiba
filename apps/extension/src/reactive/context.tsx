import {
    createContext,
    createResource,
    type JSX,
    onCleanup,
    Show,
    useContext,
} from "solid-js";
import { connectBridge } from "../runtime/bridge/client";
import { createShibaStore, type ShibaStore } from "./store";

const ShibaContext = createContext<ShibaStore>();

/** Connects to the worker-owned document and provides the reactive store. */
export function ShibaProvider(props: { children: JSX.Element }): JSX.Element {
    const [client] = createResource(connectBridge);
    return (
        <Show
            when={client()}
            fallback={
                <div class="grid min-h-screen place-items-center text-muted-foreground">
                    Loading…
                </div>
            }
        >
            {(c) => {
                const store = createShibaStore(c());
                onCleanup(store.dispose);
                return (
                    <ShibaContext.Provider value={store}>
                        {props.children}
                    </ShibaContext.Provider>
                );
            }}
        </Show>
    );
}

export function useShiba(): ShibaStore {
    const store = useContext(ShibaContext);
    if (!store) throw new Error("useShiba must be used within <ShibaProvider>");
    return store;
}
