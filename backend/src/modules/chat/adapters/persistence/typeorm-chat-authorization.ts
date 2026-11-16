import type { DataSource } from 'typeorm';
import type { ChatAuthorization } from '../../application/chat-gateways.port.js';
import type { parseChatTopic } from '../../domain/chat-topic.js';
interface AuthorizationRow {
  allowed: boolean;
}
export class TypeormChatAuthorization implements ChatAuthorization {
  constructor(private readonly dataSource: Pick<DataSource, 'query'>) {}
  async isAllowed(userId: string, topic: ReturnType<typeof parseChatTopic>) {
    let rows: AuthorizationRow[];
    if (topic.kind === 'direct') {
      const [first, second] = topic.participants!;
      rows = (await this.dataSource.query(
        `SELECT EXISTS (
          SELECT 1 FROM public.friend
          WHERE status = 'accepted'
            AND ((requester_id = $1 AND addressee_id = $2)
              OR (requester_id = $2 AND addressee_id = $1))
            AND $3 IN (requester_id, addressee_id)
        ) AS allowed`,
        [first, second, userId],
      )) as AuthorizationRow[];
    } else if (topic.kind === 'team') {
      rows = (await this.dataSource.query(
        `SELECT EXISTS (
          SELECT 1 FROM public.user_team
          WHERE team_id = $1 AND user_id = $2
        ) AS allowed`,
        [topic.entityId, userId],
      )) as AuthorizationRow[];
    } else {
      rows = (await this.dataSource.query(
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
      )) as AuthorizationRow[];
    }
    return rows[0]?.allowed === true;
  }

  async displayName(userId: string) {
    const rows = (await this.dataSource.query(
      `SELECT COALESCE(NULLIF(BTRIM(name), ''), NULLIF(BTRIM(username), ''), 'Atleta') AS display_name FROM public.users WHERE id = $1`,
      [userId],
    )) as Array<{ display_name: string }>;
    return rows[0]?.display_name ?? 'Atleta';
  }
}
