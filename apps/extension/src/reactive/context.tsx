import {
    createContext,
    createResource,
    type JSX,
    onCleanup,
    Show,
    useContext,
} from "solid-js";
import { createRuntime } from "../runtime/container";
import { startSync } from "../runtime/sync";
import { createShibaStore, type ShibaStore } from "./store";

const ShibaContext = createContext<ShibaStore>();

/** Loads the runtime, provides the reactive store, and starts sync if configured. */
export function ShibaProvider(props: { children: JSX.Element }): JSX.Element {
    const [runtime] = createResource(createRuntime);
    return (
        <Show
            when={runtime()}
            fallback={
                <div class="grid min-h-screen place-items-center text-muted-foreground">
                    Loading…
                </div>
            }
        >
            {(rt) => {
                const store = createShibaStore(rt());
                onCleanup(store.dispose);

                let sync: { stop(): void } | null = null;
                void startSync(rt().doc).then((handle) => {
                    sync = handle;
                });
                onCleanup(() => sync?.stop());

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
