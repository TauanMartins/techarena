import { venueTime } from '../../../../common/domain/venue-time.js';
import { assertFutureSlot } from '../../../appointments/domain/booking-policy.js';
import { assertLeagueSlot } from '../../domain/assert-league-slot.js';
import { assertMatchRescheduling } from '../../domain/assert-match-rescheduling.js';
import type { LeagueMatchInput } from '../../domain/league.js';
import { requireLeagueArena } from '../../domain/require-league-arena.js';
import { requireLeagueSchedule } from '../../domain/require-league-schedule.js';
import type { LeagueStore } from '../ports/league-store.port.js';

export async function rescheduleMatch(
  store: LeagueStore,
  actor: string,
  leagueId: string,
  matchId: string,
  input: LeagueMatchInput,
  clock: () => Date,
) {
  await store.transaction(async (manager) => {
    const rows = await manager.rescheduleMatchLockMatch(leagueId, matchId);
    const match = assertMatchRescheduling(rows[0], actor, input, clock());
    const arenaRows = await manager.rescheduleMatchFindCompatibleArena(
      input.arenaId,
      match.sportId,
    );
    requireLeagueArena(arenaRows[0]);
    const scheduleRows = await manager.rescheduleMatchFindSchedule(
      input.scheduleId,
    );
    requireLeagueSchedule(scheduleRows[0]);
    const scheduledAt = venueTime(input.date, scheduleRows[0].horary);
    assertFutureSlot(scheduledAt, clock());
    const slots = await manager.rescheduleMatchCheckSlot(
      input.arenaId,
      scheduledAt,
      match.appointmentId,
    );
    assertLeagueSlot(slots[0].available);
    await manager.rescheduleMatchRescheduleAppointment(
      match.appointmentId,
      scheduledAt,
      input.arenaId,
      input.scheduleId,
      arenaRows[0].longitude,
      arenaRows[0].lat,
    );
  });
}
