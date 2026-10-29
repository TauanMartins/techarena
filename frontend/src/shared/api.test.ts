import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, apiRequest, ApiError } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('asks the backend to validate chat membership before connecting to Supabase', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ topic: 'team:42', kind: 'team' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.ensureChatAccess('access-token', 'team:42')).resolves.toEqual({
      topic: 'team:42',
      kind: 'team',
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/chat/access');
    expect(JSON.parse(String(request.body))).toEqual({ topic: 'team:42' });
    expect(new Headers(request.headers).get('Authorization')).toMatch(/^Bearer .+/);
  });

  it('sends the Supabase access token as a bearer credential', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'profile-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<{ id: string }>('/users/me', 'supabase-access-token')).resolves.toEqual({
      id: 'profile-id',
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer supabase-access-token');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/users/me');
  });

  it('surfaces the backend error message and status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'PROFILE_NOT_FOUND' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(apiRequest('/users/me', 'token')).rejects.toMatchObject<ApiError>({
      name: 'ApiError',
      message: 'PROFILE_NOT_FOUND',
      status: 404,
    });
  });
});
