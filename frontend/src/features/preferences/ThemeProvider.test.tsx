import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { ThemeProvider } from './ThemeProvider';

const { themeApi } = vi.hoisted(() => ({ themeApi: vi.fn() }));
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'athlete' }, access_token: 'token' },
  }),
}));
vi.mock('../settings/api/settings.api', () => ({
  settingsApi: { theme: themeApi },
}));

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.bsTheme;
});

describe('Bootstrap theme integration', () => {
  it.each(['light', 'dark'])(
    'applies the saved %s preference to Bootstrap',
    async (theme) => {
      themeApi.mockResolvedValue({ theme });
      renderWithProviders(
        <ThemeProvider>
          <span>Application</span>
        </ThemeProvider>,
      );
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute(
          'data-bs-theme',
          theme,
        );
      });
    },
  );

  it('follows system changes and releases the media listener on unmount', async () => {
    let onChange: (() => void) | undefined;
    const media = {
      matches: true,
      addEventListener: vi.fn((_event: string, listener: () => void) => {
        onChange = listener;
      }),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(
      media as unknown as MediaQueryList,
    );
    themeApi.mockResolvedValue({ theme: 'system' });
    const { unmount } = renderWithProviders(
      <ThemeProvider>
        <span>Application</span>
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark');
    });
    act(() => {
      media.matches = false;
      onChange?.();
    });
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light');
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', onChange);
  });
});
