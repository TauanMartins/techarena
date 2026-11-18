const domains: Record<string, readonly string[]> = {
  friend: ['community', 'directory', 'chatConversations'],
  team: [
    'teams',
    'myTeams',
    'teamRequests',
    'teamDetails',
    'chatConversations',
  ],
  appointment: [
    'appointments',
    'myAppointments',
    'availability',
    'chatConversations',
  ],
  chat: ['chatConversations'],
};
/** Only known kinds invalidate account-scoped caches; notification text never acts as a command. */
export function notificationQueryPrefixes(kind?: string): readonly string[] {
  return kind
    ? (domains[kind.split('.')[0]] ?? [])
    : [...new Set(Object.values(domains).flat())];
}
