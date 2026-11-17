import { assertFutureSlot } from '../../../appointments/domain/booking-policy.js';
import { assertLeagueSlot } from '../../domain/assert-league-slot.js';
import { assertMatchCreation } from '../../domain/assert-match-creation.js';
import { assertRegisteredOpponents } from '../../domain/assert-registered-opponents.js';
import type { LeagueMatchInput } from '../../domain/league.js';
import { requireLeagueArena } from '../../domain/require-league-arena.js';
import { requireLeagueSchedule } from '../../domain/require-league-schedule.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function createMatch(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  input: LeagueMatchInput,
  clock: () => Date,
) {
  await store.transaction(async (manager) => {
    const leagues = await manager.createMatchLockLeague(leagueId);
    const league = assertMatchCreation(leagues[0], actor);
    const registered = await manager.createMatchFindRegisteredTeams(
      leagueId,
      input.homeTeamId,
      input.awayTeamId,
    );
    assertRegisteredOpponents(Number(registered[0].count));

    await manager.createMatchLockArena(input.arenaId);
    const arenas = await manager.createMatchFindCompatibleArena(
      input.arenaId,
      league.sportId,
    );
    const arena = requireLeagueArena(arenas[0]);
    const schedules = await manager.createMatchFindSchedule(input.scheduleId);
    requireLeagueSchedule(schedules[0]);
    const scheduledAt = new Date(`${input.date}T${schedules[0].horary}Z`);
    assertFutureSlot(scheduledAt, clock());
    const available = await manager.createMatchCheckSlot(
      input.arenaId,
      scheduledAt,
    );
    assertLeagueSlot(available[0].available);

    const sportRows = await manager.createMatchFindSport(league.sportId);
    const nextNumber = await manager.createMatchNextMatchNumber(leagueId);
    const matchNumber = Number(nextNumber[0].number);
    const appointments = await manager.createMatchInsertAppointment(
      actor,
      `${league.name} - Partida ${matchNumber}`.slice(0, 100),
      `Partida ${matchNumber} da liga ${league.name}`,
      scheduledAt,
      arena.longitude,
      arena.lat,
      sportRows[0].maxPlayers,
      input.arenaId,
      league.sportId,
      input.scheduleId,
    );
    const appointmentId = appointments[0].id;
    await manager.createMatchInsertMatch(
      leagueId,
      appointmentId,
      matchNumber,
      input.homeTeamId,
      input.awayTeamId,
    );
    await manager.createMatchAddTeamParticipants(
      appointmentId,
      input.homeTeamId,
      input.awayTeamId,
    );
    await manager.createMatchAddOrganizer(appointmentId, actor);
    await manager.createMatchActivateLeague(leagueId);
  });
}
