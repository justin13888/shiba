import { createResource } from "solid-js";
import { getTabCount } from "./db";
import { Logger } from "./logger";

const logger = new Logger(import.meta.url);

export const [tabCount, { refetch: tabCountRefetch }] =
    createResource(getTabCount);

/**
 * Refresh global data affected by TabDB.
 */
export const tabDBRefetch = () => {
    tabCountRefetch();
};
