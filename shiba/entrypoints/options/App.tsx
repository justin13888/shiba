import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DarkMode,
    Locale,
    Theme,
    darkModeToString,
    localeToString,
    themeToString,
} from "@/utils/settings";
import {
    QueryClient,
    QueryClientProvider,
    createMutation,
    createQuery,
} from "@tanstack/solid-query";
import type { Component } from "solid-js";

const logger = new Logger(import.meta.url);

// TODO: Implement
const Options: Component = () => {
    const [successMessage, setSuccessMessage] = createSignal("");
    const [errorMessage, setErrorMessage] = createSignal("");

    // TODO: Finish implementation after solid query bugs are fixed upstream.
    const {
        data: settings,
        isSuccess,
        isPending,
        isError,
        error,
    } = createQuery(() => ({
        queryKey: ["settings"],
        queryFn: loadSettings,
    }));
    const [formState, setFormState] = createSignal<Settings>(
        settings || DEFAULT_SETTINGS,
    );
    createEffect(() => {
        console.log("Settings:", settings);
        console.log("isSuccess", isSuccess);
    }); // TODO: REMOVE

    const mutation = createMutation(() => ({
        mutationKey: ["settings"],
        mutationFn: saveSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["settings"],
            });
            setSuccessMessage("Settings updated successfully!");
            setErrorMessage("");
        },
        onError: (error: Error) => {
            setErrorMessage(`Error updating settings: ${error.message}`);
            setSuccessMessage("");
        },
    }));

    const [hasChanges, setHasChanges] = createSignal(false);

    const handleFormSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        mutation.mutate(formState());
    };

    return (
        // TODO: Prevent edits after edit
        <div class="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 md:px-6">
            <div class="w-full max-w-md space-y-6">
                <div class="space-y-2">
                    <h1 class="text-3xl font-bold tracking-tighter">
                        Extension Settings
                    </h1>
                    <p class="text-muted-foreground">
                        Configure your extension preferences.
                    </p>
                </div>
                <Card>
                    <CardContent class="grid gap-6 m-4">
                        <Switch fallback={<p>Loading...</p>}>
                            {/* TODO: Change fallback */}
                            <Match when={isSuccess}>
                                <form onSubmit={handleFormSubmit}>
                                    <div class="grid gap-2">
                                        <Label for="darkmode">Dark Mode</Label>
                                        <Select
                                            value={settings?.darkMode}
                                            onChange={
                                                (value) => {}
                                                // TODO
                                            }
                                            options={[
                                                DarkMode.System,
                                                DarkMode.Light,
                                                DarkMode.Dark,
                                            ]}
                                            placeholder="Select dark mode..."
                                            itemComponent={(props) => (
                                                <SelectItem item={props.item}>
                                                    {darkModeToString(
                                                        props.item.rawValue,
                                                    )}
                                                </SelectItem>
                                            )}
                                        >
                                            <SelectTrigger aria-label="Dark Mode">
                                                <SelectValue<DarkMode>>
                                                    {(state) =>
                                                        darkModeToString(
                                                            state.selectedOption(),
                                                        )
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent />
                                        </Select>
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="theme">Theme</Label>
                                        <Select
                                            value={settings?.theme}
                                            onChange={
                                                (value) => {}
                                                // TODO
                                            }
                                            options={[
                                                Theme.Default,
                                                Theme.Custom,
                                            ]}
                                            placeholder="Select theme..."
                                            itemComponent={(props) => (
                                                <SelectItem item={props.item}>
                                                    {themeToString(
                                                        props.item.rawValue,
                                                    )}
                                                </SelectItem>
                                            )}
                                        >
                                            <SelectTrigger aria-label="Theme">
                                                <SelectValue<Theme>>
                                                    {(state) =>
                                                        themeToString(
                                                            state.selectedOption(),
                                                        )
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent />
                                        </Select>
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="locale">Locale</Label>
                                        <Select
                                            value={settings?.locale}
                                            onChange={
                                                (value) => {}
                                                // TODO
                                            }
                                            options={
                                                Object.values(
                                                    Locale,
                                                ) as Locale[]
                                            }
                                            placeholder="Select tjeme..."
                                            itemComponent={(props) => (
                                                <SelectItem item={props.item}>
                                                    {localeToString(
                                                        props.item.rawValue,
                                                    )}
                                                </SelectItem>
                                            )}
                                        >
                                            <SelectTrigger aria-label="Theme">
                                                <SelectValue<Locale>>
                                                    {(state) =>
                                                        localeToString(
                                                            state.selectedOption(),
                                                        )
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent />
                                        </Select>
                                    </div>
                                </form>
                            </Match>
                        </Switch>
                    </CardContent>
                </Card>
                <div class="flex justify-end">
                    <Button type="submit" disabled={mutation.isPending}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );

    //         {/* <!-- TODO: Just copy everything in better onetab -->
    //   <!-- TODO: Backup and restore settings --> */}
    //     </>
    // );
};

const queryClient = new QueryClient();
const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <Options />
        </QueryClientProvider>
    );
};

export default App;
