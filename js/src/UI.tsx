import React from "react";
import {
  createTheme,
  ActionIcon,
  AppShell,
  Flex,
  List,
  Space,
  Title,
  MantineProvider,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import "@mantine/core/styles.css";

const theme = createTheme({
  fontFamily: "Ubuntu, Roboto, Helvetica, sans-serif",
});

export const HEADER_HEIGHT = 76;

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
      <Flex p="md" gap="md">
        {children}
      </Flex>
    </AppShell.Header>
  );
}

export function AppTitle({ children }: { children: React.ReactNode }) {
  return <Title order={1}>{children}</Title>;
}

export function HeaderUserSection({ children }: { children: React.ReactNode }) {
  return <span style={{ marginLeft: "auto" }}>{children}</span>;
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

export const ListItem = List.Item;

export {
  Anchor,
  Button,
  Flex,
  List,
  Space,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
