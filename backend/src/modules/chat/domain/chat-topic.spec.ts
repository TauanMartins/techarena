import {
  directChatTopic,
  InvalidChatTopicError,
  parseChatTopic,
} from './chat-topic.js';

const firstUser = 'a0000000-0000-4000-8000-000000000000';
const secondUser = 'b0000000-0000-4000-8000-000000000000';

describe('chat topics', () => {
  it('creates a canonical direct topic independent of participant order', () => {
    expect(directChatTopic(secondUser, firstUser)).toBe(
      `direct:${firstUser}:${secondUser}`,
    );
    expect(parseChatTopic(`direct:${firstUser}:${secondUser}`)).toEqual({
      kind: 'direct',
      topic: `direct:${firstUser}:${secondUser}`,
      participants: [firstUser, secondUser],
    });
  });

  it.each([
    ['team:12', 'team'],
    ['appointment:84', 'appointment'],
  ] as const)('accepts a %s topic', (topic, kind) => {
    expect(parseChatTopic(topic).kind).toBe(kind);
  });

  it.each([
    'direct:not-a-uuid:also-not-a-uuid',
    `direct:${secondUser}:${firstUser}`,
    'team:0',
    'team:9223372036854775808',
    'appointment:1:extra',
    'chat:team:1',
  ])('rejects invalid topic %s', (topic) => {
    expect(() => parseChatTopic(topic)).toThrow(InvalidChatTopicError);
  });
});
