import type { LeagueSummary } from '../../domain/league.js';
import type { LeagueStore, SummaryRow } from '../ports/league-store.port.js';

function mapSummary(row: SummaryRow): LeagueSummary {
  return {
    ...row,
    teamCount: Number(row.teamCount),
    matchCount: Number(row.matchCount),
    completedMatchCount: Number(row.completedMatchCount),
    isOwner: Boolean(row.isOwner),
  };
}
export async function summary(
  store: LeagueStore,
  actor: string,
  leagueId?: string,
) {
  const rows = await store.queries.summaryListSummaries(
    actor,
    leagueId ?? null,
  );
  return rows.map(mapSummary);
}
