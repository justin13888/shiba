import { type Component, ErrorBoundary } from "solid-js";
import { ErrorScreen } from "@/src/ui/components/ErrorScreen";
import { BackupSection } from "@/src/ui/settings/BackupSection";
import { SyncSection } from "@/src/ui/settings/SyncSection";

export const App: Component = () => (
    <ErrorBoundary fallback={(error) => <ErrorScreen error={error} />}>
        <main class="mx-auto max-w-2xl space-y-8 bg-background p-6 text-foreground">
            <header>
                <h1 class="text-xl font-semibold">🐕 Shiba — Settings</h1>
            </header>
            <SyncSection />
            <hr class="border-border" />
            <BackupSection />
        </main>
    </ErrorBoundary>
);
