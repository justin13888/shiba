import { Switch as KSwitch } from "@kobalte/core/switch";
import type { JSX } from "solid-js";

/** An accessible on/off switch (Kobalte) with a visible label. */
export function Switch(props: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
}): JSX.Element {
    return (
        <KSwitch
            class="flex items-center gap-2"
            checked={props.checked}
            onChange={props.onChange}
            disabled={props.disabled}
        >
            <KSwitch.Input class="peer sr-only" />
            <KSwitch.Control class="inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-input transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 data-[checked]:bg-primary">
                <KSwitch.Thumb class="h-4 w-4 translate-x-0.5 rounded-full bg-background transition-transform data-[checked]:translate-x-[18px]" />
            </KSwitch.Control>
            <KSwitch.Label class="cursor-pointer select-none text-sm">
                {props.label}
            </KSwitch.Label>
        </KSwitch>
    );
}
