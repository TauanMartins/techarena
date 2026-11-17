let loading: Promise<void> | undefined;

export function loadGoogleMaps(): Promise<void> {
  if (typeof google !== 'undefined' && google.maps?.Map)
    return Promise.resolve();
  if (loading) return loading;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key)
    return Promise.reject(
      new Error(
        'O mapa ainda não está configurado. Você pode explorar as arenas pela lista.',
      ),
    );
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const callback = '__techarenaMapsReady';
    const target = window as unknown as Record<string, unknown>;
    const timeout = window.setTimeout(() => fail(), 20000);
    function cleanup() {
      window.clearTimeout(timeout);
      delete target[callback];
    }
    function fail() {
      cleanup();
      script.remove();
      loading = undefined;
      reject(
        new Error(
          'Não foi possível carregar o Google Maps. Verifique sua conexão ou use a lista de arenas.',
        ),
      );
    }
    target.gm_authFailure = () => {
      window.dispatchEvent(new Event('techarena:maps-auth-error'));
      fail();
    };
    target[callback] = () => {
      cleanup();
      resolve();
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key, v: 'weekly', loading: 'async', language: 'pt-BR', region: 'BR', callback })}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}
