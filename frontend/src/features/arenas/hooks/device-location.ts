import type { LocationPoint } from '../types/location';
let point: LocationPoint | null = null;
let expires: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
/** Device location stays in memory only; a map-selected search region is separate. */
export const deviceLocation = {
  get: () => point,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set: (next: LocationPoint | null) => {
    clearTimeout(expires);
    point = next;
    listeners.forEach((listener) => listener());
    if (next) expires = setTimeout(() => deviceLocation.set(null), 15 * 60_000);
  },
};
