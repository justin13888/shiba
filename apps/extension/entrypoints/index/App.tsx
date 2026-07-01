import { type Component, ErrorBoundary } from "solid-js";
import { ShibaProvider } from "@/src/reactive/context";
import { ConfirmProvider } from "@/src/ui/components/confirm";
import { ErrorScreen } from "@/src/ui/components/ErrorScreen";
import { SavedView } from "@/src/ui/saved";

export const App: Component = () => (
    <ErrorBoundary
        fallback={(error, reset) => (
            <ErrorScreen error={error} onRetry={reset} />
        )}
    >
        <ShibaProvider>
            <ConfirmProvider>
                <SavedView />
            </ConfirmProvider>
        </ShibaProvider>
    </ErrorBoundary>
);
