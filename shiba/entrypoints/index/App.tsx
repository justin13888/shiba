import { queryClient } from "@/utils/query";
import { MetaProvider, Title } from "@solidjs/meta";
import { HashRouter, Navigate, Route } from "@solidjs/router";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { lazy, Suspense } from "solid-js";
import { ColorModeProvider, ColorModeScript } from "@kobalte/core";

export const App = () => {
    return (
        <MetaProvider>
            <ColorModeScript />
            <QueryClientProvider client={queryClient}>
                <Title>Shiba</Title>
                <ColorModeProvider>
                    <HashRouter>
                        <Route
                            path="/saved"
                            component={lazy(() => import("./routes/saved"))}
                        />
                        <Route
                            path="/import"
                            component={lazy(() => import("./routes/import"))}
                        />
                        <Route
                            path="/export"
                            component={lazy(() => import("./routes/export"))}
                        />
                        <Route
                            path="/analytics"
                            component={lazy(() => import("./routes/analytics"))}
                        />
                        <Route
                            path="/history/:id"
                            component={lazy(() => import("./routes/history/[id]"))}
                        />
                        <Route
                            path="/history"
                            component={lazy(() => import("./routes/history"))}
                        />
                        <Route
                            path="*"
                            component={() => <Navigate href="/saved" />}
                        />
                    </HashRouter>
                </ColorModeProvider>
                <SolidQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </MetaProvider>
    );
};
