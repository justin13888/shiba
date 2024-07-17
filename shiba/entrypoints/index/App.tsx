import { Header } from "@/components/header";
import { MetaProvider, Title } from "@solidjs/meta";
import { HashRouter, Navigate, Route } from "@solidjs/router";

export const App = () => {
    return (
        <MetaProvider>
            <Title>Shiba</Title>
            <Header />
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
                    path="/history"
                    component={lazy(() => import("./routes/history"))}
                />
                <Route path="*" component={() => <Navigate href="/saved" />} />
            </HashRouter>
        </MetaProvider>
    );
};
