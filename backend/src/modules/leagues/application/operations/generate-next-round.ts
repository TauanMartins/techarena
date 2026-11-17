import { assertRoundGeneration } from '../../domain/assert-round-generation.js';
import { assertTournamentConfiguration } from '../../domain/league-policy.js';
import type { FixtureScheduleInput } from '../../domain/league.js';
import { planNextRound } from '../../domain/plan-next-round.js';
import type { LeagueStore } from '../ports/league-store.port.js';
import { createFixtureAppointments } from './create-fixture-appointments.js';
export async function generateNextRound(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  input: FixtureScheduleInput,
  clock: () => Date,
) {
  await store.transaction(async (manager) => {
    const leagueRows = await manager.generateNextRoundLockLeague(leagueId);
    const league = assertRoundGeneration(leagueRows[0], actor);
    const matchRows = await manager.generateNextRoundLockMatches(leagueId);
    const unresolvedKnockout =
      await manager.generateNextRoundCountUnresolvedKnockout(leagueId);
    const unresolvedGroups =
      await manager.generateNextRoundCountUnresolvedGroups(leagueId);
    const standings = await manager.generateNextRoundReadStandings(leagueId);
    const fixtures = planNextRound(
      league,
      matchRows,
      standings,
      Number(unresolvedKnockout[0]?.missing ?? 0),
      Number(unresolvedGroups[0]?.missing ?? 0),
    );

    const teamRows = await manager.generateNextRoundListTeams(leagueId);
    assertTournamentConfiguration(
      league.format,
      teamRows.length,
      Number(league.groupCount),
      Number(league.qualifiersPerGroup),
    );
    const sportRows = await manager.generateNextRoundFindSport(league.sportId);
    const lastNumber = Math.max(
      ...matchRows.map((match) => Number(match.matchNumber)),
      0,
    );
    await createFixtureAppointments(
      manager,
      actor,
      leagueId,
      {
        name: league.name,
        sportId: league.sportId,
        maxPlayers: sportRows[0].maxPlayers,
      },
      fixtures,
      input,
      clock,
      lastNumber + 1,
    );
  });
}
