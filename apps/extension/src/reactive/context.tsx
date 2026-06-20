import {
    createContext,
    createResource,
    type JSX,
    onCleanup,
    Show,
    useContext,
} from "solid-js";
import { createRuntime } from "../runtime/container";
import { createShibaStore, type ShibaStore } from "./store";

const ShibaContext = createContext<ShibaStore>();

/** Loads the runtime asynchronously, then provides the reactive store. */
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
