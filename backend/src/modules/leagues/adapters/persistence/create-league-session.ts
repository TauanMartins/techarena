import type { LeagueSession } from '../../application/ports/league-store.port.js';
import { arenasQueries } from './queries/arenas.js';
import { availabilityQueries } from './queries/availability.js';
import { cancelMatchQueries } from './queries/cancel-match.js';
import { createFixtureAppointmentsQueries } from './queries/create-fixture-appointments.js';
import { createMatchQueries } from './queries/create-match.js';
import { createQueries } from './queries/create.js';
import { detailsQueries } from './queries/details.js';
import { finishQueries } from './queries/finish.js';
import { generateFixturesQueries } from './queries/generate-fixtures.js';
import { generateNextRoundQueries } from './queries/generate-next-round.js';
import { inviteTeamQueries } from './queries/invite-team.js';
import { recordResultQueries } from './queries/record-result.js';
import { registerTeamQueries } from './queries/register-team.js';
import { removeTeamQueries } from './queries/remove-team.js';
import { rescheduleMatchQueries } from './queries/reschedule-match.js';
import { respondToTeamInvitationQueries } from './queries/respond-to-team-invitation.js';
import { summaryQueries } from './queries/summary.js';
import { teamInvitationsQueries } from './queries/team-invitations.js';
import { updateQueries } from './queries/update.js';
import type { SqlExecutor } from './sql-executor.js';
export function createLeagueSession(executor: SqlExecutor): LeagueSession {
  return {
    ...createFixtureAppointmentsQueries(executor),
    ...summaryQueries(executor),
    ...detailsQueries(executor),
    ...createQueries(executor),
    ...updateQueries(executor),
    ...registerTeamQueries(executor),
    ...inviteTeamQueries(executor),
    ...teamInvitationsQueries(executor),
    ...respondToTeamInvitationQueries(executor),
    ...removeTeamQueries(executor),
    ...arenasQueries(executor),
    ...availabilityQueries(executor),
    ...createMatchQueries(executor),
    ...recordResultQueries(executor),
    ...generateFixturesQueries(executor),
    ...generateNextRoundQueries(executor),
    ...rescheduleMatchQueries(executor),
    ...cancelMatchQueries(executor),
    ...finishQueries(executor),
  };
}
