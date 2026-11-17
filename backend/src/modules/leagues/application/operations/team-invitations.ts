import type { LeagueStore } from '../ports/league-store.port.js';

export async function teamInvitations(store: LeagueStore, actor: string) {
  return store.queries.teamInvitationsListInvitations(actor);
}
