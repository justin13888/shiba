import { HashRouter, Navigate, Route } from "@solidjs/router"
import { MetaProvider, Title } from "@solidjs/meta";

export const App = () => {
    return (
        <MetaProvider>
            <Title>Shiba</Title>
            <HashRouter>
                <Route path="/saved" component={lazy(() => import("./routes/saved"))} />
                <Route path="/import" component={lazy(() => import("./routes/import"))} />
                <Route path="*" component={() => <Navigate href="/saved" />} />
            </HashRouter>
        </MetaProvider>
    )
}
