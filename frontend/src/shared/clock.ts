import { useSyncExternalStore } from 'react';

let currentTimestamp = Date.now();
let interval: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!interval) {
    interval = setInterval(() => {
      currentTimestamp = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

function getSnapshot() {
  return currentTimestamp;
}

export function useCurrentTimestamp() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
