import React from "react";
import { useState } from "react";
import { createContext, useContext } from "react";

import { SettingsProvider, VersionedSettings } from "./SettingsProvider";

import * as UI from "./UI";

export type ReleaseDateFilter = "none" | "released" | "unreleased";

export interface AppSettings extends VersionedSettings {
  hideReadBooks: boolean;
  releaseDateFilter: ReleaseDateFilter;
}

function getDefaultAppSettings(): AppSettings {
  return {
    version: 2,
    hideReadBooks: false,
    releaseDateFilter: "none",
  } as AppSettings;
}

export function getAppSettingsProvider() {
  return new SettingsProvider<AppSettings>("settings", getDefaultAppSettings());
}

export const AppSettingsContext = createContext<AppSettings | null>(null);

export function useAppSettingsContext(): AppSettings {
  const appSettings = useContext(AppSettingsContext);
  if (appSettings === null) {
    throw new Error("AppSettingsContext requested but not provided");
  }
  return appSettings;
}

function AppSettingsForm({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
}) {
  const toggleHideReadBooks = () =>
    updateSettings({ ...settings, hideReadBooks: !settings.hideReadBooks });

  const updateReleaseDateFilter = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLSelectElement;
    const value = target.value as ReleaseDateFilter;
    updateSettings({ ...settings, releaseDateFilter: value });
  };

  return (
    <UI.SettingsGrid>
      <UI.Text>Hide read books</UI.Text>
      <UI.Checkbox
        checked={settings.hideReadBooks}
        onChange={toggleHideReadBooks}
      />

      <UI.Text>Filter based on release date</UI.Text>
      <UI.NativeSelect
        value={settings.releaseDateFilter}
        onChange={updateReleaseDateFilter}
        data={[
          { label: "Show all", value: "none" },
          { label: "Only show released", value: "released" },
          { label: "Only show upcoming", value: "unreleased" },
        ]}
      />
    </UI.SettingsGrid>
  );
}

export function AppSettingsButton({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  return (
    <>
      <UI.Modal
        size="lg"
        title="Settings"
        opened={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <AppSettingsForm settings={settings} updateSettings={updateSettings} />
      </UI.Modal>
      <UI.SettingsButton onClick={() => setModalVisible(!modalVisible)} />
    </>
  );
}
