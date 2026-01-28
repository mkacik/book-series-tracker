import React from "react";
import { useSyncExternalStore } from "react";

import * as UI from "./UI";

export enum BackendRoute {
  User = "/api/me",
  Books = "/api/books",
  Series = "/api/series",
  Jobs = "/api/jobs",

  Login = "/api/login",
  Logout = "/api/logout",
}

export enum Route {
  Books = "/",
  Series = "/series",
  Jobs = "/jobs",
}

function navigate(route: Route) {
  window.history.pushState({}, "", route);
  // manually trigger an event so React knows to check the URL
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePathname() {
  return useSyncExternalStore(
    // 1. Subscribe to browser navigation events
    (callback: () => void) => {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
    // 2. Get the current value
    () => window.location.pathname,
  );
}

export function RouteLink({
  route,
  children,
}: {
  route: Route;
  children: React.ReactNode;
}) {
  return (
    <UI.Button
      variant="subtle"
      size="compact-xl"
      onClick={() => navigate(route)}
    >
      <UI.Text c="black" size="lg">
        {children}
      </UI.Text>
    </UI.Button>
  );
}

export function RouteNotFound() {
  return (
    <UI.Center>
      <UI.Text c="dimmed" size="xl">
        Page Not Found
      </UI.Text>
    </UI.Center>
  );
}
