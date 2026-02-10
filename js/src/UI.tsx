import React from "react";
import {
  createTheme,
  ActionIcon,
  AppShell,
  Center,
  Flex,
  Loader,
  ScrollArea,
  Space,
  Title,
  Text,
  MantineProvider,
} from "@mantine/core";
import {
  IconAdjustments,
  IconBooks,
  IconCalendarEvent,
  IconTrash,
} from "@tabler/icons-react";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

export const IS_MOBILE_MEDIA_QUERY =
  "(orientation: portrait) and (-webkit-min-device-pixel-ratio: 2)";

const THEME_COMMON_VARS = {
  fontFamily: "Ubuntu, Roboto, Helvetica, sans-serif",
};
const MOBILE_SCALE = 1.5;
const THEME_DESKTOP = createTheme(THEME_COMMON_VARS);
const THEME_MOBILE = createTheme({ ...THEME_COMMON_VARS, scale: MOBILE_SCALE });

const ICON_SIZE_DEFAULT = 24;
const ICON_SIZE_MOBILE = ICON_SIZE_DEFAULT * MOBILE_SCALE;

export const HEADER_HEIGHT = 60;

// root
export function Layout({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: React.ReactNode;
}) {
  const headerStyle = {
    // can't set to auto, it will overlap with page content.
    height: HEADER_HEIGHT,
  };

  return (
    <MantineProvider theme={isMobile ? THEME_MOBILE : THEME_DESKTOP}>
      <AppShell header={headerStyle}>{children}</AppShell>
    </MantineProvider>
  );
}

export function Header({ children }: { children: React.ReactNode }) {
  return (
    <AppShell.Header>
      <Flex pl="md" pr="md" pt="xs" pb="xs" gap="lg" align="center" h="100%">
        {children}
      </Flex>
    </AppShell.Header>
  );
}

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <AppShell.Main>
      <ScrollArea
        h={`calc(100vh - ${HEADER_HEIGHT}px)`}
        type="always"
        offsetScrollbars="y"
      >
        <Flex h="100%" p="md" gap="lg" direction="column">
          {children}
        </Flex>
      </ScrollArea>
    </AppShell.Main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell.Section>
      <Title order={2}>{title}</Title>
      <Space h="md" />
      <Flex gap="sm" direction="column">
        {children}
      </Flex>
    </AppShell.Section>
  );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <ActionIcon variant="subtle" size="sm" onClick={onClick}>
      <IconTrash style={{ width: "70%", height: "70%" }} stroke={1.5} />
    </ActionIcon>
  );
}

export function CalendarButton({ onClick }: { onClick: () => void }) {
  return (
    <ActionIcon variant="subtle" size="sm" onClick={onClick}>
      <IconCalendarEvent style={{ width: "70%", height: "70%" }} stroke={1.5} />
    </ActionIcon>
  );
}

export function SettingsButton({
  isMobile,
  onClick,
}: {
  isMobile: boolean;
  onClick: () => void;
}) {
  return (
    <ActionIcon variant="subtle" size="sm" onClick={onClick}>
      <IconAdjustments size={isMobile ? ICON_SIZE_MOBILE : ICON_SIZE_DEFAULT} />
    </ActionIcon>
  );
}

export function BooksIcon({ isMobile }: { isMobile: boolean }) {
  return <IconBooks size={isMobile ? ICON_SIZE_MOBILE : ICON_SIZE_DEFAULT} />;
}

export function SettingsGrid({ children }: { children: React.ReactNode }) {
  const style = {
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "auto 1fr",
    gap: "0.5rem 1rem",
  };

  return <div style={style}>{children}</div>;
}

export function PageLoading() {
  return (
    <Center h="100%">
      <Loader />
    </Center>
  );
}

export function PageNotFound() {
  return (
    <Center>
      <Text c="dimmed" size="xl">
        Page not found
      </Text>
    </Center>
  );
}

export {
  Alert,
  Anchor,
  Button,
  Center,
  Checkbox,
  Flex,
  Modal,
  NativeSelect,
  PasswordInput,
  Space,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
export { DatePicker } from "@mantine/dates";
export { IconAlertTriangle } from "@tabler/icons-react";
