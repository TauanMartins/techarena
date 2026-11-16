import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AppConfiguration } from '../../../../config/environment.js';
import type { ChatProvisioning } from '../../application/chat-gateways.port.js';
import type { ParsedChatTopic } from '../../domain/chat-topic.js';
export class SupabaseChatProvisioning implements ChatProvisioning {
  constructor(private readonly configuration: AppConfiguration) {}
  async grant(topic: ParsedChatTopic, userId: string, displayName: string) {
    await this.upsert('chat_conversations', 'topic', [
      { topic: topic.topic, kind: topic.kind },
    ]);
    await this.upsert('chat_participants', 'topic,user_id', [
      { topic: topic.topic, user_id: userId, display_name: displayName },
    ]);
  }
  async revokeParticipant(topic: string, userId: string) {
    const { url, key } = this.requireSupabaseConfiguration();
    const query = new URLSearchParams({
      topic: `eq.${topic}`,
      user_id: `eq.${userId}`,
    });
    const response = await fetch(
      `${url}/rest/v1/chat_participants?${query.toString()}`,
      {
        method: 'DELETE',
        headers: this.headers(key),
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      throw new BadGatewayException(
        `Não foi possível revogar o acesso à conversa no Supabase (${response.status}).`,
      );
    }
  }

  private async upsert(
    table: 'chat_conversations' | 'chat_participants',
    conflict: string,
    records: Record<string, string>[],
  ) {
    const { url, key } = this.requireSupabaseConfiguration();
    const query = new URLSearchParams({ on_conflict: conflict });
    const response = await fetch(
      `${url}/rest/v1/${table}?${query.toString()}`,
      {
        method: 'POST',
        headers: {
          ...this.headers(key),
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(records),
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      const reason =
        response.status === 401
          ? ' Verifique se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY pertencem ao mesmo projeto e se a chave está ativa.'
          : '';
      throw new BadGatewayException(
        `Não foi possível registrar o acesso ao chat no Supabase (${response.status}).${reason}`,
      );
    }
  }

  private requireSupabaseConfiguration() {
    const { projectUrl, serviceRoleKey } = this.configuration.auth;
    if (!projectUrl || !serviceRoleKey) {
      throw new ServiceUnavailableException(
        'O acesso ao chat requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend.',
      );
    }
    return { url: projectUrl, key: serviceRoleKey };
  }

  private headers(key: string) {
    const headers: Record<string, string> = { apikey: key };
    if (!key.startsWith('sb_secret_')) {
      headers.Authorization = `Bearer ${key}`;
    }
    return {
      ...headers,
    };
  }
}
