import { describe, expect, it } from 'vitest';
import {
  chatMessageFromRow,
  conversationTopic,
  mergeChatMessages,
  otherOnlineParticipantIds,
} from './realtime';

describe('conversationTopic', () => {
  it('uses the backend policy topic for one-to-one chats independent of argument order', () => {
    expect(
      conversationTopic(
        'direct',
        'B0000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000000',
      ),
    ).toBe(
      'direct:a0000000-0000-0000-0000-000000000000:b0000000-0000-0000-0000-000000000000',
    );
  });

  it('uses stable topics for team and appointment rooms', () => {
    expect(conversationTopic('team', '42')).toBe('team:42');
    expect(conversationTopic('appointment', '84')).toBe('appointment:84');
  });

  it('rejects direct chats without the second participant', () => {
    expect(() => conversationTopic('direct', 'participant')).toThrow(
      'exige o identificador',
    );
  });
});

describe('persisted chat messages', () => {
  it('maps message rows and merges duplicates in chronological order', () => {
    const first = {
      id: 'first',
      sender_id: 'user-id',
      sender_name: 'Atleta',
      body: 'Olá',
      created_at: '2026-10-29T00:00:00.000Z',
    };
    const second = {
      ...first,
      id: 'second',
      body: 'Tudo bem?',
      created_at: '2026-10-29T00:01:00.000Z',
    };
    const mappedFirst = chatMessageFromRow(first);
    const mappedSecond = chatMessageFromRow(second);
    if (!mappedFirst || !mappedSecond)
      throw new Error('Expected valid message rows.');
    expect(chatMessageFromRow({ id: 'invalid' })).toBeNull();
    expect(mappedFirst).toEqual({
      id: 'first',
      userId: 'user-id',
      name: 'Atleta',
      text: 'Olá',
      createdAt: first.created_at,
    });
    expect(
      mergeChatMessages([mappedFirst], [mappedFirst, mappedSecond]),
    ).toEqual([mappedFirst, mappedSecond]);
  });
});

describe('chat presence', () => {
  it('excludes the current user when identifying other online participants', () => {
    expect(
      otherOnlineParticipantIds(
        {
          'current-user': [{ userId: 'CURRENT-USER' }],
          'other-user': [{ userId: 'OTHER-USER' }],
        },
        'current-user',
      ),
    ).toEqual(['other-user']);
  });

  it('uses the presence key when a participant has no user id in its metadata', () => {
    expect(
      otherOnlineParticipantIds(
        { 'current-user': [{}], 'other-user': [{}] },
        'current-user',
      ),
    ).toEqual(['other-user']);
  });
});
