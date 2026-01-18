import React from "react";
import { useSyncExternalStore } from "react";

export enum BackendRoute {
  User = "/api/me",
  Books = "/api/books",
  Series = "/api/series",
  Jobs = "/api/jobs",
}

export enum Route {
  Books = "/",
  Jobs = "/jobs",
}

function navigate(route: Route) {
  window.history.pushState({}, "", route);
  // manually trigger an event so React knows to check the URL
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function RouteLink({
  route,
  children,
}: {
  route: Route;
  children: React.ReactNode;
}) {
  return <button onClick={() => navigate(route)}>{children}</button>;
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

export function RouteNotFound() {
  return <span>404</span>;
}
