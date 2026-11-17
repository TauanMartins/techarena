import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useLocation } from './useLocation';
afterEach(() => vi.unstubAllGlobals());
it('uses device coordinates only after consent and allows a manual location', () => {
  const getCurrentPosition = vi.fn();
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
  const { result } = renderHook(() => useLocation());
  expect(getCurrentPosition).not.toHaveBeenCalled();
  act(() => result.current.locate());
  expect(result.current.pending).toBe(true);
  act(() =>
    getCurrentPosition.mock.calls[0][0]({
      coords: { latitude: -23, longitude: -46 },
    }),
  );
  expect(result.current.point).toEqual({ lat: -23, longitude: -46 });
  act(() => result.current.selectPoint({ lat: 0, longitude: 0 }));
  expect(result.current.point).toEqual({ lat: 0, longitude: 0 });
});
it('offers a fallback on denial, timeout or unsupported geolocation', () => {
  const getCurrentPosition = vi.fn();
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
  const { result } = renderHook(() => useLocation());
  act(() => result.current.locate());
  act(() => getCurrentPosition.mock.calls[0][1]({ code: 1 }));
  expect(result.current.error).toContain('negada');
  act(() => result.current.locate());
  act(() => getCurrentPosition.mock.calls[1][1]({ code: 3 }));
  expect(result.current.error).toContain('Não foi possível');
  expect(result.current.point).toBeNull();
  vi.stubGlobal('navigator', {});
  act(() => result.current.locate());
  expect(result.current.error).toContain('indisponível');
});
it('ignores a late GPS response after selecting a region manually', () => {
  const getCurrentPosition = vi.fn();
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
  const { result, unmount } = renderHook(() => useLocation());
  act(() => result.current.locate());
  act(() => result.current.selectPoint({ lat: 1, longitude: 2 }));
  act(() =>
    getCurrentPosition.mock.calls[0][0]({
      coords: { latitude: 99, longitude: 99 },
    }),
  );
  expect(result.current.point).toEqual({ lat: 1, longitude: 2 });
  act(() => result.current.locate());
  unmount();
  getCurrentPosition.mock.calls[1][1]({ code: 3 });
});
