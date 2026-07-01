import type { Component } from "solid-js";
import { ShibaProvider } from "@/src/reactive/context";
import { ConfirmProvider } from "@/src/ui/components/confirm";
import { SavedView } from "@/src/ui/saved";

export const App: Component = () => (
    <ShibaProvider>
        <ConfirmProvider>
            <SavedView />
        </ConfirmProvider>
    </ShibaProvider>
);
