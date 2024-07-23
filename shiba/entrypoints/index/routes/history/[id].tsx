import { Navigate, createAsync, useParams } from "@solidjs/router";
import { type Component, Show } from "solid-js";

const SnapshotPreview: Component = () => {
    // TODO: Implement using router preloads instead
    const { id } = useParams();
    if (!id) {
        return <Navigate href="/history" />;
    }

    const [snapshot, { refetch: snapshotRefetch }] = createResource(
        () => id,
        getSnapshot,
    ); // TODO: Replace with solid infintie query and virtual
    // TODO: Because snapshot could be undefined, errors and loading states both are undefined. (Solve by not using createResource)

    // TODO: Display tab group categories properly
    return (
        <div class="flex min-h-screen w-full flex-col items-center bg-background px-4 py-12 md:px-6">
            <div class="w-full max-w-screen-lg space-y-6">
                <h1 class="text-3xl font-bold tracking-tighter">
                    Snapshot Preview
                </h1>

                <Show
                    when={snapshot()}
                    fallback={<p>Loading...</p>} // TODO: Make it look better
                >
                    {(snapshot) => {
                        // Dictionary of Tab ID to Tab
                        const tabRecord: Record<string, Tab> =
                            snapshot().tabs.reduce(
                                (acc, tab) => {
                                    acc[tab.id] = tab;
                                    return acc;
                                },
                                {} as Record<string, Tab>,
                            );

                        // Tab Group sorted in descending order
                        const tabGroups = snapshot().tabGroups.sort(
                            (a, b) => b.timeCreated - a.timeCreated,
                        );

                        return (
                            <>
                                <h2 class="text-lg font-medium text-gray-600">
                                    {snapshot().id}
                                </h2>
                                <div class="flex flex-col">
                                    <p>
                                        <strong>Identifier:</strong>{" "}
                                        {snapshot().identifier}
                                    </p>
                                    <p>
                                        <strong>Timestamp:</strong>{" "}
                                        {dateFormatter.format(
                                            snapshot().timestamp,
                                        )}
                                    </p>
                                    <p>
                                        <strong>Triggers:</strong>{" "}
                                        {snapshot().triggers.length > 0
                                            ? snapshot().triggers.join(", ")
                                            : "Manual"}
                                    </p>
                                </div>

                                <div class="flex flex-grow">
                                    {/* TODO: Replace fallback with loading animation */}
                                    <Switch
                                        fallback={
                                            <div class="flex justify-center w-full">
                                                <p class="text-xl font-medium pt-4">
                                                    There are no tabs...
                                                </p>
                                            </div>
                                        }
                                    >
                                        <Match when={tabGroups.length > 0}>
                                            <div class="flex-col space-y-6">
                                                <For each={tabGroups}>
                                                    {(tabGroup) => {
                                                        const tabs =
                                                            tabRecord[
                                                                tabGroup.groupId
                                                            ];
                                                        // {/* TODO: Display Tab.notes */}
                                                        return (
                                                            <>
                                                                <div class="flex flex-row items-center space-x-4">
                                                                    <span class="pr-2 align-middle">
                                                                        {tabGroup.name ? (
                                                                            <p class="font-semibold">
                                                                                {
                                                                                    tabGroup.name
                                                                                }
                                                                            </p>
                                                                        ) : (
                                                                            <p class="font-semibold italic">
                                                                                Unnamed
                                                                            </p>
                                                                        )}
                                                                    </span>
                                                                    <p>
                                                                        {diffDate(
                                                                            tabGroup.timeCreated,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                {/* TODO: Display timeCreated */}
                                                                <ul class="pl-2 space-y-1">
                                                                    <For
                                                                        each={
                                                                            tabs
                                                                        }
                                                                    >
                                                                        {(
                                                                            tab,
                                                                        ) => (
                                                                            <li>
                                                                                <span class="flex flex-row items-center space-x-4">
                                                                                    <SuspenseImage
                                                                                        src={
                                                                                            tab.favicon
                                                                                        }
                                                                                        fallbackSrc="/dogface.ico"
                                                                                        alt="Favicon logo"
                                                                                        height={
                                                                                            20
                                                                                        }
                                                                                        width={
                                                                                            20
                                                                                        }
                                                                                    />

                                                                                    <a
                                                                                        href={
                                                                                            tab.url
                                                                                        }
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        class="text-blue-600"
                                                                                    >
                                                                                        {
                                                                                            tab.title
                                                                                        }
                                                                                    </a>
                                                                                </span>
                                                                            </li>
                                                                        )}
                                                                    </For>
                                                                </ul>
                                                            </>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                        </Match>
                                    </Switch>
                                </div>
                            </>
                            // TODO: Implement infinite list
                        );
                    }}
                </Show>
            </div>
        </div>
    );
};

export default SnapshotPreview;
