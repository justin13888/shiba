import { type JSX, splitProps } from "solid-js";
import { cn } from "../utils";

type Variant = "default" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "icon";

const VARIANTS: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent",
    destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};
const SIZES: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 text-sm",
    icon: "h-8 w-8",
};

export interface ButtonProps
    extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

export function Button(props: ButtonProps): JSX.Element {
    const [local, rest] = splitProps(props, ["variant", "size", "class"]);
    return (
        <button
            type="button"
            class={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                VARIANTS[local.variant ?? "default"],
                SIZES[local.size ?? "md"],
                local.class,
            )}
            {...rest}
        />
    );
}
