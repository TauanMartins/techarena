import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { InstallContext } from './InstallContext';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const pendingPrompt = useRef<InstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);
  const [prompting, setPrompting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    function onPrompt(event: Event) {
      if (isStandalone() || !window.isSecureContext) return;
      event.preventDefault();
      pendingPrompt.current = event as InstallPromptEvent;
      setCanPrompt(true);
      setError(null);
    }
    function onInstalled() {
      pendingPrompt.current = null;
      setCanPrompt(false);
      setInstalled(true);
      setError(null);
    }
    function onDisplayChange() {
      if (isStandalone()) onInstalled();
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', onDisplayChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', onDisplayChange);
    };
  }, []);

  const install = useCallback(async () => {
    const event = pendingPrompt.current;
    if (!event) return;
    // Cada evento só pode abrir o prompt uma vez, inclusive após cancelamento.
    pendingPrompt.current = null;
    setCanPrompt(false);
    setPrompting(true);
    setError(null);
    try {
      await event.prompt();
      await event.userChoice;
      // A aceitação do diálogo não confirma que a instalação foi concluída.
      // A confirmação vem de appinstalled ou do modo standalone.
    } catch {
      setError(
        'Não foi possível abrir a instalação. Use o menu do navegador ou tente novamente mais tarde.',
      );
    } finally {
      setPrompting(false);
    }
  }, []);

  return (
    <InstallContext.Provider
      value={{
        installed,
        canPrompt,
        prompting,
        isIOS,
        secure: window.isSecureContext,
        error,
        install,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}
