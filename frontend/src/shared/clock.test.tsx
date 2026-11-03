import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrentTimestamp } from './clock';

afterEach(() => vi.useRealTimers());

describe('useCurrentTimestamp', () => {
  it('updates its stable snapshot while subscribed and stops ticking on unmount', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useCurrentTimestamp());
    const initial = result.current;
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBeGreaterThan(initial);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
