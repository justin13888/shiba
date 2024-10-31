import { type Component, type ComponentProps, createSignal } from "solid-js";
import { CardTitle } from "./ui/card";

// TODO: Doesn't unfocus later
export const EditableCardTitle: Component<
    Omit<
        ComponentProps<"h3"> & {
            initialValue?: string;
            onUpdateValue: (val: string) => any;
        },
        "children"
    >
> = (props) => {
    const [isEditing, setIsEditing] = createSignal(false);
    const [value, setValue] = createSignal(props.initialValue); // use children as initial value

    const handleDoubleClick = () => {
        setValue("Untitled");
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        const currentValue = value();
        if (props.onUpdateValue && currentValue) {
            props.onUpdateValue(currentValue);
        }
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
                        }
                    }}
                    onBlur={handleBlur}
                    class="w-full border rounded px-2 py-1"
                    autofocus
                />
            ) : (
                value() || <span class="italic">Untitled</span>
            )}
        </CardTitle>
    );
};
