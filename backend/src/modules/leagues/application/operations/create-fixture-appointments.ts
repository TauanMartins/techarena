import { assertFutureSlot } from '../../../appointments/domain/booking-policy.js';
import { assertLeagueSlot } from '../../domain/assert-league-slot.js';
import type { Fixture } from '../../domain/league-policy.js';
import type { FixtureScheduleInput } from '../../domain/league.js';
import { requireLeagueArena } from '../../domain/require-league-arena.js';
import { requireLeagueSchedule } from '../../domain/require-league-schedule.js';
import type { LeagueSession } from '../ports/league-store.port.js';

export async function createFixtureAppointments(
  manager: LeagueSession,
  actor: string,
  leagueId: string,
  league: { name: string; sportId: string; maxPlayers: number },
  fixtures: Fixture[],
  input: FixtureScheduleInput,
  clock: () => Date,
  firstMatchNumber: number,
) {
  const arenaRows = await manager.createFixtureAppointmentsFindCompatibleArena(
    input.arenaId,
    league.sportId,
  );
  const arena = requireLeagueArena(arenaRows[0]);
  const scheduleRows = await manager.createFixtureAppointmentsFindSchedule(
    input.scheduleId,
  );
  const schedule = requireLeagueSchedule(scheduleRows[0]);

  for (const [index, fixture] of fixtures.entries()) {
    const fixtureDate = new Date(`${input.date}T00:00:00.000Z`);
    fixtureDate.setUTCDate(
      fixtureDate.getUTCDate() + index * input.daysBetweenMatches,
    );
    const date = fixtureDate.toISOString().slice(0, 10);
    const scheduledAt = new Date(`${date}T${schedule.horary}Z`);
    assertFutureSlot(scheduledAt, clock());
    const slotRows = await manager.createFixtureAppointmentsCheckSlot(
      input.arenaId,
      scheduledAt,
    );
    assertLeagueSlot(
      slotRows[0].available,
      `The arena is unavailable at ${date} ${schedule.horary.slice(0, 5)}`,
    );
    const matchNumber = firstMatchNumber + index;
    const appointmentRows =
      await manager.createFixtureAppointmentsInsertAppointment(
        actor,
        `${league.name} - Partida ${matchNumber}`.slice(0, 100),
        `Partida ${matchNumber} da liga ${league.name}`,
        scheduledAt,
        arena.longitude,
        arena.lat,
        league.maxPlayers,
        input.arenaId,
        league.sportId,
        input.scheduleId,
      );
    const appointmentId = appointmentRows[0].id;
    await manager.createFixtureAppointmentsInsertMatch(
      leagueId,
      appointmentId,
      matchNumber,
      fixture.homeTeamId,
      fixture.awayTeamId,
      fixture.phase,
      fixture.roundNumber,
      fixture.groupNumber,
    );
    await manager.createFixtureAppointmentsAddTeamParticipants(
      appointmentId,
      fixture.homeTeamId,
      fixture.awayTeamId,
    );
    await manager.createFixtureAppointmentsAddOrganizer(appointmentId, actor);
    await manager.createFixtureAppointmentsActivateLeague(leagueId);
  }
}
