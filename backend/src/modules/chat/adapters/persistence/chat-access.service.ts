import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { AppConfiguration } from '../../../../config/environment.js';
import type { ChatAccessPort } from '../../application/chat-access.port.js';
import {
  InvalidChatTopicError,
  parseChatTopic,
} from '../../domain/chat-topic.js';

interface AuthorizationRow {
  allowed: boolean;
}

export class ChatAccessService implements ChatAccessPort {
  constructor(
    private readonly dataSource: Pick<DataSource, 'query'>,
    private readonly configuration: AppConfiguration,
  ) {}

  async ensureAccess(userId: string, rawTopic: string) {
    this.requireSupabaseConfiguration();
    let parsed: ReturnType<typeof parseChatTopic>;
    try {
      parsed = parseChatTopic(rawTopic);
    } catch (cause) {
      if (cause instanceof InvalidChatTopicError) {
        throw new BadRequestException(cause.message);
      }
      throw cause;
    }
    const allowed = await this.isAllowed(userId, parsed);
    if (!allowed) {
      await this.revokeParticipant(parsed.topic, userId);
      throw new ForbiddenException(
        'Você não participa desta conversa ou não tem mais acesso a ela.',
      );
    }
    const profiles = await this.dataSource.query(
      `SELECT COALESCE(NULLIF(BTRIM(name), ''), NULLIF(BTRIM(username), ''), 'Atleta') AS display_name
       FROM public.users WHERE id = $1`,
      [userId],
    ) as Array<{ display_name: string }>;
    await this.upsert('chat_conversations', 'topic', [
      { topic: parsed.topic, kind: parsed.kind },
    ]);
    await this.upsert('chat_participants', 'topic,user_id', [
      {
        topic: parsed.topic,
        user_id: userId,
        display_name: (profiles[0]?.display_name ?? 'Atleta').slice(0, 150),
      },
    ]);
    let accessStillValid: boolean;
    try {
      accessStillValid = await this.isAllowed(userId, parsed);
    } catch (cause) {
      await this.revokeParticipant(parsed.topic, userId);
      throw cause;
    }
    if (!accessStillValid) {
      await this.revokeParticipant(parsed.topic, userId);
      throw new ForbiddenException(
        'Seu acesso à conversa foi removido durante a autorização.',
      );
    }
    return { topic: parsed.topic, kind: parsed.kind };
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

  private async isAllowed(
    userId: string,
    topic: ReturnType<typeof parseChatTopic>,
  ) {
    let rows: AuthorizationRow[];
    if (topic.kind === 'direct') {
      const [first, second] = topic.participants!;
      rows = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT 1 FROM public.friend
          WHERE status = 'accepted'
            AND ((requester_id = $1 AND addressee_id = $2)
              OR (requester_id = $2 AND addressee_id = $1))
            AND $3 IN (requester_id, addressee_id)
        ) AS allowed`,
        [first, second, userId],
      ) as AuthorizationRow[];
    } else if (topic.kind === 'team') {
      rows = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT 1 FROM public.user_team
          WHERE team_id = $1 AND user_id = $2
        ) AS allowed`,
        [topic.entityId, userId],
      ) as AuthorizationRow[];
    } else {
      rows = await this.dataSource.query(
        `SELECT EXISTS (
          SELECT 1 FROM public.appointment
          WHERE id = $1 AND deleted_at IS NULL
            AND (
              organizer_id = $2
              OR EXISTS (
                SELECT 1 FROM public.user_appointment
                WHERE appointment_id = public.appointment.id
                  AND user_id = $2
              )
            )
        ) AS allowed`,
        [topic.entityId, userId],
      ) as AuthorizationRow[];
    }
    return rows[0]?.allowed === true;
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
      const reason = response.status === 401
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
