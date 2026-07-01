import { AlertDialog } from "@kobalte/core/alert-dialog";
import {
    createContext,
    createSignal,
    type JSX,
    Show,
    useContext,
} from "solid-js";
import { Button } from "@/src/lib/ui/button";

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>();

/**
 * Imperative confirmation backed by Kobalte's accessible `AlertDialog` (focus
 * trap, `Escape`, `role="alertdialog"`, restored focus). Usage:
 * `if (await confirm({ title, destructive: true })) doIt()`.
 */
export function ConfirmProvider(props: { children: JSX.Element }): JSX.Element {
    const [options, setOptions] = createSignal<ConfirmOptions | null>(null);
    let resolver: ((ok: boolean) => void) | undefined;

    const confirm: ConfirmFn = (opts) =>
        new Promise<boolean>((resolve) => {
            resolver = resolve;
            setOptions(opts);
        });

    const settle = (ok: boolean): void => {
        setOptions(null);
        resolver?.(ok);
        resolver = undefined;
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {props.children}
            <AlertDialog
                open={options() !== null}
                onOpenChange={(open: boolean) => {
                    if (!open) settle(false);
                }}
            >
                <AlertDialog.Portal>
                    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-black/40" />
                    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <AlertDialog.Content class="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
                            <AlertDialog.Title class="text-base font-semibold text-foreground">
                                {options()?.title}
                            </AlertDialog.Title>
                            <Show when={options()?.description}>
                                <AlertDialog.Description class="mt-1 text-sm text-muted-foreground">
                                    {options()?.description}
                                </AlertDialog.Description>
                            </Show>
                            <div class="mt-4 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => settle(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant={
                                        options()?.destructive
                                            ? "destructive"
                                            : "default"
                                    }
                                    size="sm"
                                    onClick={() => settle(true)}
                                >
                                    {options()?.confirmLabel ?? "Confirm"}
                                </Button>
                            </div>
                        </AlertDialog.Content>
                    </div>
                </AlertDialog.Portal>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const confirm = useContext(ConfirmContext);
    if (!confirm)
        throw new Error("useConfirm must be used within <ConfirmProvider>");
    return confirm;
}
