import type { LeagueInput } from '../../domain/league.js';
import type { LeagueStore } from '../ports/league-store.port.js';
import { summary } from './summary.js';
export async function create(
  store: LeagueStore,
  actor: string,
  input: LeagueInput,
) {
  const created = await store.queries.createInsertLeague(
    input.name,
    input.description ?? null,
    actor,
    input.sportId,
    input.tournamentFormat,
    input.groupCount ?? 2,
    input.qualifiersPerGroup ?? 2,
  );
  return (await summary(store, actor, created[0].id))[0];
}
