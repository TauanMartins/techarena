import type { SupabaseClient } from '@supabase/supabase-js';
import { chatMessageFromRow, type ChatMessage } from './message-mapper';

const HISTORY_PAGE_SIZE = 50;
const MESSAGE_COLUMNS = 'id, sender_id, sender_name, body, created_at';

export interface MessagePage {
  messages: ChatMessage[];
  hasOlderMessages: boolean;
}

function mapRows(rows: unknown[] | null): ChatMessage[] {
  return (rows ?? [])
    .map(chatMessageFromRow)
    .filter((message): message is ChatMessage => message !== null)
    .reverse();
}

export async function loadLatestMessages(
  client: SupabaseClient,
  topic: string,
): Promise<MessagePage> {
  const { data, error } = await client
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('topic', topic)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_PAGE_SIZE);
  if (error) throw error;

  return {
    messages: mapRows(data),
    hasOlderMessages: (data?.length ?? 0) === HISTORY_PAGE_SIZE,
  };
}

export async function loadOlderMessages(
  client: SupabaseClient,
  topic: string,
  oldest: Pick<ChatMessage, 'createdAt' | 'id'>,
): Promise<MessagePage> {
  const cursor = `created_at.lt.${oldest.createdAt},and(created_at.eq.${oldest.createdAt},id.lt.${oldest.id})`;
  const { data, error } = await client
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('topic', topic)
    .or(cursor)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(HISTORY_PAGE_SIZE);
  if (error) throw error;

  return {
    messages: mapRows(data),
    hasOlderMessages: (data?.length ?? 0) === HISTORY_PAGE_SIZE,
  };
}

export async function createChatMessage(
  client: SupabaseClient,
  topic: string,
  userId: string,
  text: string,
): Promise<ChatMessage> {
  const { data, error } = await client
    .from('chat_messages')
    .insert({
      topic,
      sender_id: userId,
      body: text,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;

  const message = chatMessageFromRow(data);
  if (!message) throw new Error('A mensagem não pôde ser carregada.');
  return message;
}
