import React from "react";
import {
  createTheme,
  ActionIcon,
  AppShell,
  Center,
  Flex,
  List,
  Loader,
  Space,
  Title,
  Text,
  MantineProvider,
} from "@mantine/core";
import { IconAdjustments, IconTrash } from "@tabler/icons-react";

import "@mantine/core/styles.css";

const theme = createTheme({
  fontFamily: "Ubuntu, Roboto, Helvetica, sans-serif",
});

export const HEADER_HEIGHT = 60;

// root
export function Layout({ children }: { children: React.ReactNode }) {
  const headerStyle = {
    // can't set to auto, it will overlap with page content.
    height: HEADER_HEIGHT,
  };

  return (
    <MantineProvider theme={theme}>
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
      <Flex p="md" gap="lg" direction="column">
        {children}
      </Flex>
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

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <ActionIcon variant="subtle" size="sm" onClick={onClick}>
      <IconAdjustments />
    </ActionIcon>
  );
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

export const ListItem = List.Item;

export {
  Alert,
  Anchor,
  Button,
  Center,
  Checkbox,
  Flex,
  List,
  Modal,
  NativeSelect,
  PasswordInput,
  Space,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

export { IconBooks, IconAlertTriangle } from "@tabler/icons-react";
