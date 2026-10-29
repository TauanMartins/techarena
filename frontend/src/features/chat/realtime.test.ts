import { describe, expect, it } from 'vitest';
import { conversationTopic, isChatMessage } from './realtime';

describe('conversationTopic', () => {
  it('uses the backend policy topic for one-to-one chats independent of argument order', () => {
    expect(conversationTopic('direct', 'B0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000'))
      .toBe('direct:a0000000-0000-0000-0000-000000000000:b0000000-0000-0000-0000-000000000000');
  });

  it('uses stable topics for team and appointment rooms', () => {
    expect(conversationTopic('team', '42')).toBe('team:42');
    expect(conversationTopic('appointment', '84')).toBe('appointment:84');
  });

  it('rejects direct chats without the second participant', () => {
    expect(() => conversationTopic('direct', 'participant')).toThrow('exige o identificador');
  });
});

describe('isChatMessage', () => {
  it('accepts a complete message payload and rejects malformed payloads', () => {
    expect(isChatMessage({
      id: 'message-id',
      userId: 'user-id',
      name: 'Atleta',
      text: 'Vamos jogar?',
      createdAt: '2026-10-29T00:00:00.000Z',
    })).toBe(true);
    expect(isChatMessage({ text: 'malformed' })).toBe(false);
  });
});
