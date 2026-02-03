const STORAGE_KEY_PREFIX: string = "BSTAPP.";

export interface VersionedSettings {
  version: number;
}

export class SettingsProvider<T extends VersionedSettings> {
  private readonly storageKey: string;
  private readonly currentVersion: number;
  private readonly defaultSettings: T;

  constructor(storageKey: string, defaultSettings: T) {
    this.storageKey = STORAGE_KEY_PREFIX + storageKey;
    this.defaultSettings = defaultSettings;
    this.currentVersion = defaultSettings.version;
  }

  public getSettings(): T {
    const rawData = localStorage.getItem(this.storageKey);

    if (!rawData) {
      return this.resetToDefaults();
    }

    try {
      const parsed = JSON.parse(rawData);
      if (parsed.version !== this.currentVersion) {
        return this.resetToDefaults();
      }

      return parsed as T;
    } catch (error) {
      console.log(error);
      return this.resetToDefaults();
    }
  }

  public saveSettings(settings: T): void {
    if (settings.version !== this.currentVersion) {
      throw new Error("Settings version mismatch, refresh the page!");
    }
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  private resetToDefaults(): T {
    localStorage.removeItem(this.storageKey);
    const settings = this.defaultSettings;
    this.saveSettings(settings);
    return settings;
  }
}
