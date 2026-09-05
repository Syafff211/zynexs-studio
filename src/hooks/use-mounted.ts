"use client";

import * as React from "react";

/**
 * `false` on the server and during hydration, `true` afterwards.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useState(false)` + `useEffect(() => setMounted(true))` so it does not
 * trigger a cascading render pass — the server snapshot is used while
 * hydrating and React swaps in the client snapshot in the same commit.
 */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return React.useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
