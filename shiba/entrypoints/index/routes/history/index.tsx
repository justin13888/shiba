import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { dateFormatter } from "@/utils";
import { getSnapshots } from "@/utils/snapshot";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { type Component, Show } from "solid-js";

// TODO: Implement list displaying past snapshots and card viewer for each snapshot, allowing restoration
// For version timeline, display date and number of tabs and changes
// TODO: Implement snapshot restoration
// TODO: Re-style entire page
const History: Component = () => {
    const [snapshots, { refetch: snapshotRefetch }] =
        createResource(getSnapshots); // TODO: Replace with solid infintie query and virtual
    const [lastUpdated, setLastUpdated] = createSignal(Date.now());

    createEffect(() => {
        if (snapshots()) {
            setLastUpdated(Date.now());
        }
    });

    const navigate = useNavigate();

    return (
        <>
            <Title>History | Shiba</Title>
            <div class="flex min-h-screen w-full flex-col items-center bg-background px-4 py-12 md:px-6">
                <div class="w-full max-w-screen-lg space-y-6">
                    <h1 class="text-3xl font-bold tracking-tighter">History</h1>
                    <div class="space-y-4">
                        <Button
                            class={"w-40 mt-4"}
                            onClick={async () => {
                                await generateManualSnapshot();
                                snapshotRefetch();
                            }}
                        >
                            Create Snapshot
                        </Button>

                        <h2 class="text-lg font-medium text-gray-600">
                            Snapshots
                        </h2>
                        <Show when={snapshots()} fallback={<p>Loading...</p>}>
                            {(snapshots) => (
                                <Switch
                                    fallback={
                                        <div class="flex justify-center w-full">
                                            <p class="text-xl font-medium pt-4">
                                                There are no snapshots...
                                            </p>
                                        </div>
                                    }
                                >
                                    <Match when={snapshots().length > 0}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead class="w-[100px]">
                                                        ID
                                                    </TableHead>
                                                    <TableHead>
                                                        Identifier
                                                    </TableHead>
                                                    <TableHead>
                                                        Timestamp
                                                    </TableHead>
                                                    <TableHead>
                                                        Triggers
                                                    </TableHead>
                                                    <TableHead class="text-center">
                                                        Tab Count
                                                    </TableHead>
                                                    <TableHead class="text-center">
                                                        Group Count
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <For each={snapshots()}>
                                                    {/* TODO: Make rows clickable */}
                                                    {(snapshot) => (
                                                        <TableRow // TODO: Make it obvious rows are clickable
                                                            onClick={() => {
                                                                navigate(
                                                                    `/history/${snapshot.id}`,
                                                                );
                                                            }}
                                                        >
                                                            <TableCell class="font-medium">
                                                                {snapshot.id}
                                                            </TableCell>
                                                            {/* TODO: Make identifier hoverable */}
                                                            <TableCell>
                                                                {
                                                                    snapshot.identifier
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {diffDate(
                                                                    snapshot.timestamp,
                                                                )}
                                                            </TableCell>
                                                            {/* TODO: Make trigger IDs hoverable */}
                                                            <TableCell>
                                                                {snapshot
                                                                    .triggers
                                                                    .length
                                                                    ? snapshot.triggers.join(
                                                                          "\n",
                                                                      )
                                                                    : "Manual"}
                                                            </TableCell>
                                                            <TableCell class="text-center">
                                                                {
                                                                    snapshot
                                                                        .tabs
                                                                        .length
                                                                }
                                                            </TableCell>
                                                            <TableCell class="text-center">
                                                                {
                                                                    snapshot
                                                                        .tabGroups
                                                                        .length
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </For>
                                            </TableBody>
                                            <TableCaption>
                                                Snapshots as of{" "}
                                                {dateFormatter.format(
                                                    lastUpdated(),
                                                )}
                                                .
                                            </TableCaption>
                                        </Table>

                                        {/* <div class="grid grid-cols-1 gap-4">
                                <For each={snapshots()}>
                                    {(snapshot) => (
                                        <div class="bg-gray-100 p-4 rounded-md">
                                            <p>Snapshot</p>
                                            <p>{snapshot.timestamp}</p>
                                            <p>{snapshot.tabs.length} tabs</p>
                                        </div>
                                    )}
                                </For>
                            </div> */}
                                    </Match>
                                </Switch>
                            )}
                        </Show>
                    </div>
                </div>
            </div>
        </>
    );
};

export default History;
