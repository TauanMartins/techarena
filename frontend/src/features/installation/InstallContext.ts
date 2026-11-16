import { createContext } from 'react';

export interface InstallContextValue {
  installed: boolean;
  canPrompt: boolean;
  prompting: boolean;
  isIOS: boolean;
  secure: boolean;
  error: string | null;
  install: () => Promise<void>;
}

export const InstallContext = createContext<InstallContextValue | null>(null);
