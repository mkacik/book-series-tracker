import React from "react";
import {
  createTheme,
  AppShell,
  Flex,
  Space,
  Title,
  MantineProvider,
} from "@mantine/core";

import "@mantine/core/styles.css";

const theme = createTheme({
  fontFamily: "Ubuntu, Roboto, Helvetica, sans-serif",
});

// root
export function Layout({ children }: { children: React.ReactNode }) {
  const headerStyle = {
    // can't set to auto, it will overlap with page content.
    height: 76,
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

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell.Section p="md">
      <Title order={2}>{title}</Title>
      <Space h="md" />
      {children}
    </AppShell.Section>
  );
}

export const Main = AppShell.Main;
