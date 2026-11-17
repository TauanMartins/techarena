export type ChatKind = 'direct' | 'team' | 'appointment';
export type ParsedChatTopic =
  | {
      kind: 'direct';
      topic: string;
      participants: [string, string];
    }
  | {
      kind: 'team';
      topic: string;
      entityId: string;
    }
  | {
      kind: 'appointment';
      topic: string;
      entityId: string;
    };
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const bigintPattern = /^[1-9]\d{0,18}$/;
export const maxBigint = 9223372036854775807n;
