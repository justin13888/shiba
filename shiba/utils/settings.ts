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
