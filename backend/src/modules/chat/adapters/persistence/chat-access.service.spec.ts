import { DataSource } from 'typeorm';
import { parseEnvironment } from '../../../../config/environment.js';
import { ChatAccessService } from './chat-access.service.js';

const userId = 'a0000000-0000-4000-8000-000000000000';
const friendId = 'b0000000-0000-4000-8000-000000000000';
const topic = `direct:${userId}:${friendId}`;
const configuration = parseEnvironment({
  DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/techarena',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-key',
});

describe('ChatAccessService', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:secret@localhost:5432/techarena',
  });
  const query = vi.spyOn(dataSource, 'query');

  afterEach(() => {
    query.mockReset();
    vi.unstubAllGlobals();
  });

  it('only provisions the authenticated participant after checking the friendship', async () => {
    query
      .mockResolvedValueOnce([{ allowed: true }])
      .mockResolvedValueOnce([{ display_name: 'Atleta' }])
      .mockResolvedValueOnce([{ allowed: true }]);
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = new ChatAccessService(dataSource, configuration);

    await expect(service.ensureAccess(userId, topic)).resolves.toEqual({
      topic,
      kind: 'direct',
    });

    expect(query).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://project.supabase.co/rest/v1/chat_conversations?on_conflict=topic',
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://project.supabase.co/rest/v1/chat_participants?on_conflict=topic%2Cuser_id',
    );
    const participantRequest = fetchMock.mock.calls[1][1];
    expect(participantRequest?.headers).toMatchObject({
      apikey: 'server-only-key',
      Authorization: 'Bearer server-only-key',
    });
    expect(participantRequest?.body).toBe(
      JSON.stringify([{ topic, user_id: userId, display_name: 'Atleta' }]),
    );
  });

  it('sends modern Supabase secret keys only in the apikey header', async () => {
    query
      .mockResolvedValueOnce([{ allowed: true }])
      .mockResolvedValueOnce([{ display_name: 'Atleta' }])
      .mockResolvedValueOnce([{ allowed: true }]);
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const modernConfiguration = parseEnvironment({
      DATABASE_URL: 'postgres://localhost:5432/techarena',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test-key',
    });
    const service = new ChatAccessService(dataSource, modernConfiguration);

    await service.ensureAccess(userId, topic);

    for (const [, request] of fetchMock.mock.calls) {
      expect(request?.headers).toMatchObject({
        apikey: 'sb_secret_test-key',
      });
      expect(request?.headers).not.toHaveProperty('Authorization');
    }
  });

  it('does not provision access if the current database denies membership', async () => {
    query.mockResolvedValueOnce([{ allowed: false }]);
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = new ChatAccessService(dataSource, configuration);

    await expect(service.ensureAccess(userId, topic)).rejects.toMatchObject({
      status: 403,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/rest/v1/chat_participants?');
  });
});
