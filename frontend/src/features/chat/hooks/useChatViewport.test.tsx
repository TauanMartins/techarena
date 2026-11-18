import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useChatViewport } from './useChatViewport';
function Viewport() {
  const ref = useChatViewport(true);
  return (
    <div
      data-testid="viewport"
      ref={ref}
    />
  );
}
afterEach(() => vi.unstubAllGlobals());
it('tracks keyboard viewport height and offset and removes listeners on unmount', () => {
  const viewport = Object.assign(new EventTarget(), {
    height: 800,
    offsetTop: 0,
    scale: 1,
  });
  vi.stubGlobal('visualViewport', viewport);
  const remove = vi.spyOn(viewport, 'removeEventListener');
  const { unmount } = render(<Viewport />);
  expect(
    screen.getByTestId('viewport').style.getPropertyValue('--chat-height'),
  ).toBe('800px');
  act(() => {
    viewport.height = 430;
    viewport.offsetTop = 20;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(
    screen.getByTestId('viewport').style.getPropertyValue('--chat-height'),
  ).toBe('430px');
  expect(
    screen.getByTestId('viewport').style.getPropertyValue('--chat-top'),
  ).toBe('20px');
  act(() => {
    viewport.height = 800;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(
    screen.getByTestId('viewport').style.getPropertyValue('--chat-height'),
  ).toBe('800px');
  unmount();
  expect(remove).toHaveBeenCalledTimes(2);
});
