import { switchToOrOpenTab } from "@/utils";
import { saveAllTabs, saveSelectedTabs } from "@/utils/actions";
import { URLS } from "@/utils/constants";
import { Logger, cleanupLogs } from "@/utils/logger";
import { loadLoggingSettings, loadSnapshotSettings } from "@/utils/settings";
import { type RetentionPolicy, runSnapshot } from "@/utils/snapshot";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/sandbox";

export default defineBackground({
    main() {
        const logger = new Logger("background.ts");
        logger.debug("Started Shiba background script");

        browser.commands.onCommand.addListener((command) => {
            switch (command) {
                case "save-selected-tabs":
                    logger.debug("Saving selected tabs");
                    saveSelectedTabs();
                    break;
                case "save-all-tabs":
                    logger.debug("Saving all tabs");
                    saveAllTabs();
                    break;
                case "open-lists":
                    logger.debug("Opening lists");
                    switchToOrOpenTab(URLS.SAVED);
                    break;
                default:
                    logger.debug("Unknown command", command);
                    break;
            }
        });

        // Do log cleanup
        const doLogCleanup = async (minLogs: number, minAge: number) => {
            logger.debug("Cleaning up logs");
            const logsDeleted = await cleanupLogs(minLogs, minAge);
            logger.debug(`Logs deleted: ${logsDeleted}`);
        };
        const setupLogCleanup = async () => {
            logger.debug("Setting up log cleanup");

            try {
                const logSettings = await loadLoggingSettings();

                logger.debug(
                    `Setting up log cleanup interval for ${logSettings.cleanupInterval} minutes`,
                );
                setInterval(
                    async () => {
                        try {
                            await doLogCleanup(
                                logSettings.minLogs,
                                logSettings.minAge,
                            );
                        } catch (cleanupError) {
                            logger.error(
                                "Error during log cleanup",
                                cleanupError,
                            );
                        }
                    },
                    logSettings.cleanupInterval * 60 * 1000,
                );

                doLogCleanup(logSettings.minLogs, logSettings.minAge);
            } catch (error) {
                logger.fatal("Failed to setup log cleanup", error);
            }
        };
        setupLogCleanup();

        // Do snapshot generation
        const updateSnapshots = async (
            retentionPolicies: RetentionPolicy[],
        ) => {
            logger.debug("Updating snapshots");
            const newSnapshot = await runSnapshot(retentionPolicies);
            if (newSnapshot) {
                logger.debug("Snapshot generated", newSnapshot);
            } else {
                logger.debug("No new snapshot generated");
            }
        };
        const setupSnapshots = async () => {
            logger.info("Setting up snapshots");
            try {
                const snapshotSettings = await loadSnapshotSettings();
                logger.debug("Snapshot settings", snapshotSettings);

                logger.debug(
                    `Setting up snapshot interval for ${snapshotSettings.reconciliationInterval} minutes`,
                );
                setInterval(
                    async () => {
                        try {
                            await updateSnapshots(
                                snapshotSettings.retentionPolicies,
                            );
                        } catch (snapshotError) {
                            logger.error(
                                "Error during snapshot generation",
                                snapshotError,
                            );
                        }
                    },
                    snapshotSettings.reconciliationInterval * 60 * 1000,
                );

                updateSnapshots(snapshotSettings.retentionPolicies);
            } catch (error) {
                logger.fatal("Failed to setup snapshots", error);
            }
        };
        setupSnapshots();
        logger.debug("Shiba background script setup complete");
    },
});
