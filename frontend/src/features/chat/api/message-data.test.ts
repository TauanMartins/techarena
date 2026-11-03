import { describe, expect, it } from 'vitest';
import { createChatMessage, loadLatestMessages, loadOlderMessages } from './message-data';
import { createSupabaseMock } from '../../../test/mocks/supabase';

const row = (id: string, created_at: string) => ({
  id, sender_id: 'user-1', sender_name: 'Atleta', body: `Mensagem ${id}`, created_at,
});

describe('chat message data', () => {
  it('loads the latest rows in chronological order and sets the older-page flag', async () => {
    const supabase = createSupabaseMock();
    supabase.setQueryResult({ data: [row('newer', '2026-10-29T10:01:00Z'), row('older', '2026-10-29T10:00:00Z')], error: null });
    const result = await loadLatestMessages(supabase.client, 'team:1');
    expect(result.messages.map((message) => message.id)).toEqual(['older', 'newer']);
    expect(result.hasOlderMessages).toBe(false);
    expect(supabase.query.eq).toHaveBeenCalledWith('topic', 'team:1');
  });

  it('applies the cursor when loading older messages and propagates database errors', async () => {
    const supabase = createSupabaseMock();
    supabase.setQueryResult({ data: [row('older', '2026-10-29T09:59:00Z')], error: null });
    const result = await loadOlderMessages(supabase.client, 'team:1', { id: 'first', createdAt: '2026-10-29T10:00:00Z' });
    expect(result.messages[0]?.id).toBe('older');
    expect(supabase.query.or).toHaveBeenCalledWith('created_at.lt.2026-10-29T10:00:00Z,and(created_at.eq.2026-10-29T10:00:00Z,id.lt.first)');

    const error = new Error('Realtime database unavailable');
    supabase.setQueryResult({ data: null, error });
    await expect(loadLatestMessages(supabase.client, 'team:1')).rejects.toBe(error);
  });

  it('persists a message and rejects invalid rows or failed inserts', async () => {
    const supabase = createSupabaseMock();
    supabase.setQueryResult({ data: row('created', '2026-10-29T10:02:00Z'), error: null });
    await expect(createChatMessage(supabase.client, 'team:1', 'user-1', 'Olá')).resolves.toMatchObject({ id: 'created', text: 'Mensagem created' });
    expect(supabase.query.insert).toHaveBeenCalledWith({ topic: 'team:1', sender_id: 'user-1', body: 'Olá' });

    supabase.setQueryResult({ data: { id: 'invalid' }, error: null });
    await expect(createChatMessage(supabase.client, 'team:1', 'user-1', 'x')).rejects.toThrow('A mensagem não pôde ser carregada.');
    const error = new Error('Insert rejected');
    supabase.setQueryResult({ data: null, error });
    await expect(createChatMessage(supabase.client, 'team:1', 'user-1', 'x')).rejects.toBe(error);
  });
});
