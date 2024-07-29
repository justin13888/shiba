import { nanoid } from "nanoid";
import { RetentionPolicy } from "./snapshot";

const logger = new Logger(import.meta.url);

export enum DarkMode {
    Light = "light",
    Dark = "dark",
    System = "system",
}

export const darkModeToString = (value: DarkMode): string => {
    switch (value) {
        case DarkMode.Light:
            return "Light";
        case DarkMode.Dark:
            return "Dark";
        case DarkMode.System:
            return "System";
    }
};

export enum Theme {
    /**
     * Default Shiba theme
     */
    Default = "default",
    /**
     * Custom theme with CSS
     */
    Custom = "custom", // TODO: Implement this completely. Include text area to input CSS
}

export const themeToString = (value: Theme): string => {
    switch (value) {
        case Theme.Default:
            return "Default";
        case Theme.Custom:
            return "Custom";
    }
};

// TODO: Implement more locales
export enum Locale {
    English = "en-US",
    SimplifiedChinese = "zh-CN",
}

export const localeToString = (value: Locale): string => {
    switch (value) {
        case Locale.English:
            return "English (US)";
        case Locale.SimplifiedChinese:
            return "简体中文";
    }
};

export interface Settings {
    darkMode: DarkMode;
    theme: Theme;
    locale: Locale;
}

// TODO: Implement more settings (notifications)

export const DEFAULT_SETTINGS: Settings = {
    darkMode: DarkMode.System,
    theme: Theme.Default,
    locale: Locale.English,
} as const;

export const saveSettings = async (settings: Settings) => {
    await browser.storage.sync.set({ settings });
    logger.info("Settings saved", settings);
};

export const loadSettings = async (): Promise<Settings> => {
    const { settings } = await browser.storage.sync.get("settings");
    return (settings || DEFAULT_SETTINGS) as Settings;
};

// TODO: Add UI to configure this
// TODO: Make sure UI does full background script reload after change
export interface SnapshotSettings {
    /**
     * Interval in minutes to take snapshots
     * Recommended to be less than the smallest retention policy frequency
     */
    reconciliationInterval: number;
    /**
     * Retention policies for snapshots
     * Having more policy has negligible performance impact
     */
    retentionPolicies: RetentionPolicy[];
}

export const DEFAULT_SNAPSHOT_SETTINGS: SnapshotSettings = {
    reconciliationInterval: 30,
    retentionPolicies: [
        new RetentionPolicy({
            id: nanoid(), // TODO: Should be written so it's generated once and saved immediately to storage.
            frequency: 60,
            retain: 1440,
        }),
        new RetentionPolicy({
            id: nanoid(), // TODO: Should be written so it's generated once and saved immediately to storage.
            frequency: 1440,
            retain: 10080,
        }),
    ],
} as const;

export const saveSnapshotSettings = async (
    snapshotSettings: SnapshotSettings,
) => {
    await browser.storage.sync.set({ snapshotSettings });
    logger.info("Snapshot settings saved", snapshotSettings);
};

export const loadSnapshotSettings = async (): Promise<SnapshotSettings> => {
    const { snapshotSettings } =
        await browser.storage.sync.get("snapshotSettings");
    return (snapshotSettings || DEFAULT_SNAPSHOT_SETTINGS) as SnapshotSettings;
};

// TODO: Add UI to configure this
// TODO: Make sure UI does full background script reload after change
export interface LoggingSettings {
    /**
     * Interval in minutes to clean up logs
     * Recommended to be less than the smallest retention policy frequency
     */
    cleanupInterval: number;

    /**
     * Minimum log level to log
     */
    logLevel: LevelFilter; // TODO: Not being used currently. Need to be hooked into logger initialization

    /**
     * Minimum number of logs to keep
     */
    minLogs: number;

    /**
     * Minimum age in minutes to keep logs
     */
    minAge: number;
}

export const DEFAULT_LOGGING_SETTINGS: LoggingSettings = {
    cleanupInterval: 60,
    logLevel: LevelFilter.DEBUG,
    minLogs: 1000,
    minAge: 10080, // 1 week
} as const;

export const saveLoggingSettings = async (loggingSettings: LoggingSettings) => {
    await browser.storage.sync.set({ loggingSettings });
    logger.info("Logging settings saved", loggingSettings);
};

export const loadLoggingSettings = async (): Promise<LoggingSettings> => {
    const { loggingSettings } =
        await browser.storage.sync.get("loggingSettings");
    return (loggingSettings || DEFAULT_LOGGING_SETTINGS) as LoggingSettings;
};
