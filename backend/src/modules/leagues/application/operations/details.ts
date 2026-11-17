import { DomainError } from '../../../../common/domain/domain-error.js';
import type { LeagueStore } from '../ports/league-store.port.js';
import { summary } from './summary.js';
export async function details(
  store: LeagueStore,
  actor: string,
  leagueId: string,
) {
  const league = (await summary(store, actor, leagueId))[0];
  if (!league)
    throw new DomainError('not_found', 'LEAGUE_NOT_FOUND', 'League not found');

  const teams = await store.queries.detailsListTeams(leagueId);
  const matches = await store.queries.detailsListMatches(leagueId);
  for (const match of matches) {
    if (match.result) {
      match.result.homeScore = Number(match.result.homeScore);
      match.result.awayScore = Number(match.result.awayScore);
    }
    match.matchNumber = Number(match.matchNumber);
  }
  const standings = await store.queries.detailsListStandings(leagueId);
  for (const standing of standings) {
    standing.played = Number(standing.played);
    standing.wins = Number(standing.wins);
    standing.losses = Number(standing.losses);
    standing.draws = Number(standing.draws);
    standing.points = Number(standing.points);
    standing.scoreFor = Number(standing.scoreFor);
    standing.scoreAgainst = Number(standing.scoreAgainst);
  }
  const captainRows = await store.queries.detailsListCaptainTeams(
    leagueId,
    actor,
  );
  const invitations = league.isOwner
    ? await store.queries.detailsListInvitations(leagueId)
    : [];
  return {
    league,
    teams,
    invitations,
    matches,
    standings,
    myCaptainTeamIds: captainRows.map((row) => row.teamId),
  };
}
