import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  document.head.querySelectorAll('script').forEach((script) => script.remove());
});
it('fails clearly without a configured key', async () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
  const { loadGoogleMaps } = await import('./load-google-maps');
  await expect(loadGoogleMaps()).rejects.toThrow('não está configurado');
});
it('loads once for concurrent consumers and retries network failures', async () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
  const { loadGoogleMaps } = await import('./load-google-maps');
  const first = loadGoogleMaps();
  const rejection = expect(first).rejects.toThrow('Não foi possível carregar');
  expect(loadGoogleMaps()).toBe(first);
  document.head.querySelector('script')!.dispatchEvent(new Event('error'));
  await rejection;
  const second = loadGoogleMaps();
  const script = document.head.querySelector('script')!;
  expect(script.src).not.toContain('libraries=places');
  const callback = new URL(script.src).searchParams.get('callback')!;
  (window as unknown as Record<string, () => void>)[callback]();
  await second;
  vi.stubGlobal('google', { maps: { Map: vi.fn() } });
  await expect(loadGoogleMaps()).resolves.toBeUndefined();
});
