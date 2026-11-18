import { useSyncExternalStore } from 'react';
const query = '(min-width: 768px)';
function subscribe(listener: () => void) {
  const media = window.matchMedia?.(query);
  media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}
export function useDesktopViewport() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
