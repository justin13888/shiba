import { ColorModeContext } from "@kobalte/core";
import { Moon, Sun } from "lucide-solid";
import { Component, useContext } from "solid-js";
import { Motion } from "solid-Motionone";

export const DarkModeSwitcher: Component = () => {
    const { colorMode, toggleColorMode } = useContext(ColorModeContext)!;

    return (
        <button
            onClick={toggleColorMode}
            class="p-2 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-300"
            aria-label={colorMode() === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
            <Motion.div
                animate={{ rotate: colorMode() === "dark" ? 360 : 0 }}
                transition={{ duration: 0.5, easing: "ease-in-out" }}
                class="relative w-6 h-6"
            >
                <Motion.div
                    initial={false}
                    animate={{ opacity: colorMode() === "dark" ? 0 : 1 }}
                    transition={{ duration: 0.25 }}
                    class="absolute inset-0"
                >
                    <Sun class="w-6 h-6 text-yellow-500" />
                </Motion.div>
                <Motion.div
                    initial={false}
                    animate={{ opacity: colorMode() === "dark" ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    class="absolute inset-0"
                >
                    <Moon class="w-6 h-6 text-blue-500" />
                </Motion.div>
            </Motion.div>
        </button>
    )
}
