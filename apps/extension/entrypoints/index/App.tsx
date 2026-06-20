import type { Component } from "solid-js";
import { ShibaProvider } from "@/src/reactive/context";
import { SavedView } from "@/src/ui/saved";

export const App: Component = () => (
    <ShibaProvider>
        <SavedView />
    </ShibaProvider>
);
