import { Logger } from "@/utils/logger";
import { exportTabBundles, exportTabBundlesOneTab } from "@/utils/parse";
import { Title } from "@solidjs/meta";
import { type Component, createSignal } from "solid-js";

// TODO: Style
const logger = new Logger(import.meta.url);

const Export: Component = () => {
    const [exportString, setExportString] = createSignal("");
    const [exportOption, setExportOption] = createSignal<"shiba" | "oneTab">(
        "shiba",
    );
    const [feedbackMessage, setFeedbackMessage] = createSignal<string | null>(
        null,
    );
    const [feedbackType, setFeedbackType] = createSignal<
        "success" | "error" | null
    >(null);
    // TODO: Combine feedbackMessage and feedbackType into a single signal

    const handleSubmit = async (event: SubmitEvent) => {
        event.preventDefault();

        try {
            if (exportOption() === "shiba") {
                setExportString(await exportTabBundles());
                setFeedbackMessage(
                    "Tabs successfully exported in Shiba format!",
                );
                setFeedbackType("success");
            } else if (exportOption() === "oneTab") {
                setExportString(await exportTabBundlesOneTab());
                setFeedbackMessage(
                    "Tabs successfully exported in OneTab format!",
                );
                setFeedbackType("success");
            } else {
                setFeedbackMessage("Invalid import option. Please try again.");
                setFeedbackType("error");
            }

            logger.info("Export string:", exportString());
        } catch (error) {
            setFeedbackMessage(
                `Error exporting tabs: ${error instanceof Error ? error.message : error}`,
            );
            setFeedbackType("error");
            logger.error("Error exporting tabs", error);
        }
    };

    return (
        <>
            <Title>Export | Shiba</Title>
            <div class="min-h-screen flex items-center justify-center bg-gray-200">
                <div class="flex justify-center items-center h-screen bg-gray-100">
                    <form
                        onSubmit={handleSubmit}
                        class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
                    >
                        <div class="mb-4">
                            <label
                                for="textInput"
                                class="block text-gray-700 text-sm font-bold mb-2"
                            >
                                Enter Text:
                            </label>
                            <textarea
                                id="textInput"
                                value={exportString()}
                                onInput={(e) => setExportString(e.target.value)}
                                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Select export option below..."
                            />
                            {/* TODO: Implement text area so it looks nice to copy */}
                            {/* TODO: Implement copy to clipboard button */}
                        </div>

                        {/* Import Buttons */}
                        <div class="flex items-center justify-between">
                            <button
                                type="submit"
                                onClick={() => setExportOption("shiba")}
                                class="bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700"
                            >
                                Export in Shiba format (JSON)
                            </button>
                            <button
                                type="submit"
                                onClick={() => setExportOption("oneTab")}
                                class="bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-blue-700"
                            >
                                Export in OneTab format
                            </button>
                        </div>

                        {/* Feedback Message */}
                        {feedbackMessage() && (
                            <div
                                class={`mt-4 p-4 rounded ${feedbackType() === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                            >
                                {feedbackMessage()}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
};

export default Export;
