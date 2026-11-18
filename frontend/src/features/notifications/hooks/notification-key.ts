export const notificationKey = (userId: string) =>
  ['notifications', userId] as const;
