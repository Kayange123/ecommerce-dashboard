import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True only after the first client-side render — guards client-only UI
 * (portals, window-dependent values) against SSR/hydration mismatches.
 * Prefer this over a useState+useEffect("mounted") pattern: that causes
 * an extra render pass (ESLint's react-hooks/set-state-in-effect rule
 * flags it) since it calls setState synchronously inside an effect;
 * useSyncExternalStore returns the correct value on the very render
 * that follows hydration, with no extra render in between.
 */
export function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
