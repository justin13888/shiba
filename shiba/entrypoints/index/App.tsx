import { queryClient } from "@/utils/query";
import { ColorModeProvider, ColorModeScript } from "@kobalte/core";
import { MetaProvider, Title } from "@solidjs/meta";
import {
    HashRouter,
    Navigate,
    Route,
    type RouteSectionProps,
} from "@solidjs/router";
import { QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { Suspense, lazy } from "solid-js";

const Layout = (props: RouteSectionProps) => (
    <MetaProvider>
        <ColorModeScript />
        <QueryClientProvider client={queryClient}>
            <Title>Shiba</Title>
            <ColorModeProvider>{props.children}</ColorModeProvider>
            <SolidQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </MetaProvider>
);

export const App = () => (
    <HashRouter root={Layout}>
        <Route path="/saved" component={lazy(() => import("./routes/saved"))} />
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
        <Route path="*" component={() => <Navigate href="/saved" />} />
    </HashRouter>
);
