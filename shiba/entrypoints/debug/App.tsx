import { Button } from "@/components/ui/button";
import { LogLevel, Logger, getLogs } from "@/utils/logger";
import {
    For,
    Match,
    Show,
    Switch,
    createResource,
    createSignal,
} from "solid-js";

// TODO: Implement log viewing with tanstack virtual, query
export const App = () => {
    const logger = new Logger(import.meta.url);
    const addTestLogs = async () => {
        console.log("Adding test logs");
        logger.info("Test: This is an informational message", {
            additional: "data",
        });
        logger.error("Test: This is an error message", { errorCode: 123 });
    };

    const [page, setPage] = createSignal(1);
    const [pageLimit, setPageLimit] = createSignal(10);
    const [lastKeys, setLastKeys] = createSignal<number[]>([]);

    const getLastKey = () => (page() > 1 ? lastKeys()[page() - 2] : undefined);
    // Resource to fetch logs based on the current page
    const [logs, { mutate }] = createResource(
        () => [getLastKey(), pageLimit()] as [number | undefined, number],
        async ([lastKey, pageLimit]) => {
            const result = await getLogs(lastKey, pageLimit);

            // Update lastKeys array with the last key of the fetched logs
            if (result.length > 0) {
                setLastKeys((prev) => {
                    const newKeys = [...prev];
                    newKeys[page() - 1] = result[result.length - 1].id;
                    return newKeys;
                });
            }
            return result;
        },
    );

    const handleNextPage = () => {
        if (logs()?.length === pageLimit()) {
            setPage(page() + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page() > 1) {
            setPage(page() - 1);
        }
    };

    return (
        <div class="container space-y-4">
            <div class="pb-4 align-middle">
                <h1 class="text-4xl font-extrabold">Shiba Debug</h1>
            </div>
            <Button onClick={addTestLogs}>Add test logs</Button>
            <div class="flex flex-col">
                <Show
                    when={logs.state === "ready"}
                    fallback={<p>Loading logs...</p>}
                >
                    <ul class="list-none h-[200px] overflow-y-auto">
                        <For each={logs()}>
                            {({
                                id, // TODO: Fix type because id is implicitly added
                                timestamp,
                                level,
                                identifier,
                                message,
                                meta,
                            }) => (
                                <li class="flex flex-row">
                                    <div class="flex flex-col">
                                        <span class="p-1">
                                            [{id}] &nbsp; [
                                            {new Date(timestamp).toISOString()}]
                                            &nbsp; [{identifier || "UNKNOWN"}]
                                            &nbsp;
                                            <Switch
                                                fallback={<span>UNKNOWN</span>}
                                            >
                                                <Match
                                                    when={
                                                        level === LogLevel.DEBUG
                                                    }
                                                >
                                                    <span class="text-gray-500">
                                                        DEBUG
                                                    </span>
                                                </Match>
                                                <Match
                                                    when={
                                                        level === LogLevel.INFO
                                                    }
                                                >
                                                    <span class="text-blue-500">
                                                        INFO
                                                    </span>
                                                </Match>
                                                <Match
                                                    when={
                                                        level === LogLevel.WARN
                                                    }
                                                >
                                                    <span class="text-yellow-500">
                                                        WARN
                                                    </span>
                                                </Match>
                                                <Match
                                                    when={
                                                        level ===
                                                            LogLevel.ERROR ||
                                                        level === LogLevel.FATAL
                                                    }
                                                >
                                                    <span class="text-red-500">
                                                        ERROR
                                                    </span>
                                                </Match>
                                            </Switch>
                                            &nbsp;
                                            <span>{message}</span>
                                        </span>
                                        <pre class="ml-4">
                                            {JSON.stringify(meta, null, 2)}
                                        </pre>
                                    </div>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </div>
            <p>Page count: {page()}</p>
            <div class="flex flex-row space-x-6">
                <Button onClick={handlePreviousPage} disabled={page() === 1}>
                    Previous Page
                </Button>
                <Button
                    onClick={handleNextPage}
                    disabled={(() => {
                        const l = logs();
                        if (l === undefined) return true;

                        return (l.length || 0) < pageLimit();
                    })()}
                >
                    Next Page
                </Button>
            </div>
            {/* TODO: Add Download logs button */}
            {/* TODO: Add ability to filter out sensitive logs (e.g. PII), make sure to retain relative log position */}
        </div>
    );
};
