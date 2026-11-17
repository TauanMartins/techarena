export function directChatTopic(firstUserId: string, secondUserId: string) {
  const [first, second] = [
    firstUserId.toLowerCase(),
    secondUserId.toLowerCase(),
  ].sort();
  return `direct:${first}:${second}`;
}
