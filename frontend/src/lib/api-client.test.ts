import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, apiRequest, ApiError } from './api-client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('supports inviting teams and responding to league invitations', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.inviteLeagueTeam('league-token', '12', '31');
    await api.respondToLeagueTeamInvitation('league-token', '9', 'accept');

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/leagues/12/team-invitations',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ teamId: '31' }),
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://localhost:3000/leagues/team-invitations/9',
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });
  });

  it('creates leagues and records tournament match results through the API', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.createLeague('league-token', {
      name: 'Liga de teste',
      sportId: '4',
      tournamentFormat: 'round_robin',
    });
    await api.recordLeagueResult('league-token', '12', '31', {
      homeScore: 2,
      awayScore: 1,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/leagues');
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://localhost:3000/leagues/12/matches/31/result',
    );
    const createRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const resultRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(createRequest.method).toBe('POST');
    expect(JSON.parse(String(createRequest.body))).toEqual({
      name: 'Liga de teste',
      sportId: '4',
      tournamentFormat: 'round_robin',
    });
    expect(resultRequest.method).toBe('PUT');
    expect(JSON.parse(String(resultRequest.body))).toEqual({
      homeScore: 2,
      awayScore: 1,
    });
    expect(new Headers(resultRequest.headers).get('Authorization')).toBe(
      'Bearer league-token',
    );
  });

  it('asks the backend to validate chat membership before connecting to Supabase', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ topic: 'team:42', kind: 'team' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api.ensureChatAccess('access-token', 'team:42'),
    ).resolves.toEqual({
      topic: 'team:42',
      kind: 'team',
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/chat/access',
    );
    expect(JSON.parse(String(request.body))).toEqual({ topic: 'team:42' });
    expect(new Headers(request.headers).get('Authorization')).toMatch(
      /^Bearer .+/,
    );
  });

  it('sends the Supabase access token as a bearer credential', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'profile-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiRequest<{ id: string }>('/users/me', 'supabase-access-token'),
    ).resolves.toEqual({
      id: 'profile-id',
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer supabase-access-token',
    );
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

    await expect(
      apiRequest('/users/me', 'token'),
    ).rejects.toMatchObject<ApiError>({
      name: 'ApiError',
      message: 'PROFILE_NOT_FOUND',
      status: 404,
    });
  });
});

it('serializes discovery and personal history filters without hiding past chat memberships', async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ items: [] }), { status: 200 }),
      ),
    );
  vi.stubGlobal('fetch', fetchMock);
  await api.listArenas('token', {
    lat: 0,
    longitude: 0,
    radiusKm: 5,
    page: 2,
    sportId: '1',
  });
  await api.listPersonalAppointments('token', { period: 'past', page: 3 });
  await api.listMyAppointments('token', 2);
  expect(fetchMock.mock.calls[0][0]).toContain('lat=0&longitude=0&radiusKm=5');
  expect(fetchMock.mock.calls[1][0]).toContain('period=past');
  expect(fetchMock.mock.calls[2][0]).not.toContain('from=');
  expect(fetchMock.mock.calls[2][0]).toContain('page=2');
});
