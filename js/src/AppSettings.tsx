import React from "react";
import { useState } from "react";
import { createContext, useContext } from "react";

import { SettingsProvider, VersionedSettings } from "./SettingsProvider";

import * as UI from "./UI";

export interface AppSettings extends VersionedSettings {
  hideReadBooks: boolean;
}

function getDefaultAppSettings(): AppSettings {
  return {
    version: 1,
    hideReadBooks: false,
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

  return (
    <UI.Checkbox
      checked={settings.hideReadBooks}
      onChange={toggleHideReadBooks}
      label="Hide read books"
    />
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
