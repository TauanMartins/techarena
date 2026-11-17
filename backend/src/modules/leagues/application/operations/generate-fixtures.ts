import { DomainError } from '../../../../common/domain/domain-error.js';
import { assertFixtureGeneration } from '../../domain/assert-fixture-generation.js';
import { assertFixturesNotGenerated } from '../../domain/assert-fixtures-not-generated.js';
import { buildInitialFixtures } from '../../domain/league-policy.js';
import type { FixtureScheduleInput } from '../../domain/league.js';
import type { LeagueStore } from '../ports/league-store.port.js';
import { createFixtureAppointments } from './create-fixture-appointments.js';
export async function generateFixtures(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  input: FixtureScheduleInput,
  clock: () => Date,
) {
  await store.transaction(async (manager) => {
    const leagues = await manager.generateFixturesLockLeague(leagueId);
    const league = assertFixtureGeneration(leagues[0], actor);
    const existing =
      await manager.generateFixturesFindExistingMatches(leagueId);
    assertFixturesNotGenerated(existing.length);
    const teamRows = await manager.generateFixturesListTeams(leagueId);
    const teamIds = teamRows.map((row) => row.id);
    const fixtures = buildInitialFixtures(
      teamIds,
      league.format,
      Number(league.groupCount),
      Number(league.qualifiersPerGroup),
    );
    if (league.format === 'groups_knockout') {
      for (const [index, teamId] of teamIds.entries()) {
        await manager.generateFixturesAssignGroup(
          leagueId,
          teamId,
          (index % Number(league.groupCount)) + 1,
        );
      }
    }
    const sportRows = await manager.generateFixturesFindSport(league.sportId);
    if (!sportRows.length)
      throw new DomainError(
        'not_found',
        'LEAGUE_SPORT_NOT_FOUND',
        'The league sport no longer exists',
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
      1,
    );
    await manager.generateFixturesActivateLeague(leagueId);
  });
}
