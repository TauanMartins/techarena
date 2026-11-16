import { StrictMode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallApp } from './InstallApp';
import { InstallProvider } from './InstallProvider';

function renderInstallation() {
  return render(
    <StrictMode>
      <InstallProvider>
        <InstallApp />
      </InstallProvider>
    </StrictMode>,
  );
}

function offerInstallation(outcome: 'accepted' | 'dismissed' = 'dismissed') {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(
    new Event('beforeinstallprompt', { cancelable: true }),
    {
      prompt,
      userChoice: Promise.resolve({ outcome }),
    },
  );
  act(() => window.dispatchEvent(event));
  return { event, prompt };
}

beforeEach(() => {
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android Chrome');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('InstallApp', () => {
  it('offers browser instructions when no native prompt is available', () => {
    renderInstallation();
    expect(screen.queryByRole('button', { name: 'Instalar app' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Como instalar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Abra este site no Chrome.')).toBeInTheDocument();
  });

  it.each(['accepted', 'dismissed'] as const)(
    'consumes the prompt only on user interaction (%s), without assuming installation',
    async (outcome) => {
      renderInstallation();
      const { event, prompt } = offerInstallation(outcome);
      expect(event.defaultPrevented).toBe(true);
      expect(prompt).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
      await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
      expect(
        await screen.findByRole('button', { name: 'Como instalar' }),
      ).toBeEnabled();
      expect(
        screen.getByRole('region', { name: 'Instalar TechArena' }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Como instalar' }));
      expect(prompt).toHaveBeenCalledOnce();
    },
  );

  it('hides installation controls only after the installed event', () => {
    renderInstallation();
    offerInstallation();
    act(() => window.dispatchEvent(new Event('appinstalled')));
    expect(
      screen.queryByRole('region', { name: 'Instalar TechArena' }),
    ).toBeNull();
  });

  it('does not offer installation inside a standalone app', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    renderInstallation();
    expect(
      screen.queryByRole('region', { name: 'Instalar TechArena' }),
    ).toBeNull();
    expect(offerInstallation().event.defaultPrevented).toBe(false);
  });

  it.each(['iPhone', 'iPad'])('shows Safari instructions on %s', (device) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(device);
    renderInstallation();
    fireEvent.click(screen.getByRole('button', { name: 'Como instalar' }));
    expect(screen.getByText('Abra este site no Safari.')).toBeInTheDocument();
    expect(
      screen.getByText('Toque em Adicionar à Tela de Início.'),
    ).toBeInTheDocument();
  });

  it('recognizes iPadOS when Safari uses a desktop user agent', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Macintosh Safari');
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    vi.stubGlobal('navigator', {
      userAgent: 'Macintosh Safari',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    renderInstallation();
    fireEvent.click(screen.getByRole('button', { name: 'Como instalar' }));
    expect(screen.getByText('Abra este site no Safari.')).toBeInTheDocument();
  });

  it('recognizes the iOS standalone flag', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'iPhone',
      platform: 'iPhone',
      standalone: true,
    });
    renderInstallation();
    expect(
      screen.queryByRole('region', { name: 'Instalar TechArena' }),
    ).toBeNull();
  });

  it('explains HTTPS when opened through an insecure network address', () => {
    vi.stubGlobal('isSecureContext', false);
    renderInstallation();
    expect(offerInstallation().event.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Como instalar' }));
    expect(screen.getByText(/endereço seguro \(HTTPS\)/)).toBeInTheDocument();
  });

  it('handles a rejected native prompt and allows a fresh offer', async () => {
    renderInstallation();
    const { prompt } = offerInstallation();
    prompt.mockRejectedValueOnce(new Error('unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível abrir a instalação',
    );
    offerInstallation();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Instalar app' })).toBeEnabled();
  });
});
