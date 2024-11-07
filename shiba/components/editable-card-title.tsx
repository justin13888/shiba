import { type Component, type ComponentProps, createSignal } from "solid-js";
import { CardTitle } from "./ui/card";
import { cn } from "@/utils";

export const EditableCardTitle: Component<
    Omit<
        ComponentProps<"h3"> & {
            initialValue: string;
            onUpdateValue: (val: string) => any;
        },
        "children"
    >
> = (props) => {
    let lastValue = props.initialValue;
    const [isEditing, setIsEditing] = createSignal(false);
    const [value, setValue] = createSignal(props.initialValue); // use children as initial value

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        const currentValue = value();
        if (props.onUpdateValue && currentValue) {
            props.onUpdateValue(currentValue);
            lastValue = currentValue;
        }
    };

    const handleReset = () => {
        setIsEditing(false);
        setValue(props.initialValue);
    };

    return (
        <CardTitle
            {...props}
            onDblClick={handleDoubleClick}
            class={props.class}
        >
            {isEditing() ? (
                <input
                    type="text"
                    value={value()}
                    onInput={(e) => {
                        setValue(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleBlur();
                        } else if (e.key === "Escape") {
                            handleReset();
                        }
                    }}
                    onBlur={handleBlur}
                    class="w-full border rounded px-2 py-1"
                    autofocus
                />
            ) : (
                <span class={cn(
                    "py-[14px]",
                    value() && "italic",
                )}>{value() || "Untitled"}</span>
            )}
        </CardTitle>
    );
};
