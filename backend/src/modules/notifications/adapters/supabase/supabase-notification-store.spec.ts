import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseNotificationStore } from './supabase-notification-store.js';
import type { AppConfiguration } from '../../../../config/environment.js';
const configuration = {
  auth: {
    projectUrl: 'https://project.supabase.co',
    serviceRoleKey: 'sb_secret_test',
  },
} as AppConfiguration;
const input = {
  recipientId: '11111111-1111-4111-8111-111111111111',
  eventKey: 'message:1',
  kind: 'system.info',
  title: 'Aviso',
  body: 'Mensagem de teste',
};
afterEach(() => vi.unstubAllGlobals());
describe('Supabase notification store', () => {
  it('uses the stable recipient/event conflict key and never overwrites existing read state', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    await new SupabaseNotificationStore(configuration).insertOnce(input);
    const [url, request] = fetch.mock.calls[0];
    expect(url).toContain('on_conflict=recipient_id,event_key');
    expect(request.headers.Prefer).toBe(
      'resolution=ignore-duplicates,return=minimal',
    );
    expect(request.headers.Authorization).toBeUndefined();
    expect(JSON.parse(request.body)).toEqual({
      recipient_id: input.recipientId,
      event_key: input.eventKey,
      kind: input.kind,
      title: input.title,
      body: input.body,
      target_path: null,
    });
  });
  it('supports legacy server keys and reports errors without exposing the response or key', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('sensitive details', { status: 500 }));
    vi.stubGlobal('fetch', fetch);
    await expect(
      new SupabaseNotificationStore({
        ...configuration,
        auth: { ...configuration.auth, serviceRoleKey: 'legacy-key' },
      }).insertOnce(input),
    ).rejects.toThrow('Unable to persist notification');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer legacy-key',
    );
  });
  it('fails before making network requests when server credentials are missing', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      new SupabaseNotificationStore({
        ...configuration,
        auth: { projectUrl: null, serviceRoleKey: null },
      }).insertOnce(input),
    ).rejects.toThrow('Notifications are not configured');
    expect(fetch).not.toHaveBeenCalled();
  });
});
