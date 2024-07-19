import type { Component, JSX } from "solid-js";

export interface SuspenseImageProp extends Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, "alt"> {
    fallbackSrc: string;
    alt: string;
};

/**
 * Image component that attempts to render the image and falls back to a placeholder if it fails.
 * The timeout is faster than usual (to prevent long loading times).
 */
export const SuspenseImage: Component<SuspenseImageProp> = ({src, fallbackSrc, class: className, ...props}) => {
    return (
        // biome-ignore lint/a11y/useAltText: This is user of component's responsibility
        <img
            src={src || fallbackSrc}
            class={`transition-opacity duration-400 ${className || ""}`}
            onError={(e) => {
                e.currentTarget.src = fallbackSrc;
            }}
            {...props}

        />
    )
};
