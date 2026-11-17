import type { LeagueSummary } from '../../domain/league.js';
import type { ArenasQueries } from './arenas-queries.port.js';
import type { AvailabilityQueries } from './availability-queries.port.js';
import type { CancelMatchQueries } from './cancel-match-queries.port.js';
import type { CreateFixtureAppointmentsQueries } from './create-fixture-appointments-queries.port.js';
import type { CreateMatchQueries } from './create-match-queries.port.js';
import type { CreateQueries } from './create-queries.port.js';
import type { DetailsQueries } from './details-queries.port.js';
import type { FinishQueries } from './finish-queries.port.js';
import type { GenerateFixturesQueries } from './generate-fixtures-queries.port.js';
import type { GenerateNextRoundQueries } from './generate-next-round-queries.port.js';
import type { InviteTeamQueries } from './invite-team-queries.port.js';
import type { RecordResultQueries } from './record-result-queries.port.js';
import type { RegisterTeamQueries } from './register-team-queries.port.js';
import type { RemoveTeamQueries } from './remove-team-queries.port.js';
import type { RescheduleMatchQueries } from './reschedule-match-queries.port.js';
import type { RespondToTeamInvitationQueries } from './respond-to-team-invitation-queries.port.js';
import type { SummaryQueries } from './summary-queries.port.js';
import type { TeamInvitationsQueries } from './team-invitations-queries.port.js';
import type { UpdateQueries } from './update-queries.port.js';
export type SummaryRow = LeagueSummary & {
  teamCount: number | string;
  matchCount: number | string;
  completedMatchCount: number | string;
  isOwner: boolean;
};
export interface LeagueSession
  extends
    CreateFixtureAppointmentsQueries,
    SummaryQueries,
    DetailsQueries,
    CreateQueries,
    UpdateQueries,
    RegisterTeamQueries,
    InviteTeamQueries,
    TeamInvitationsQueries,
    RespondToTeamInvitationQueries,
    RemoveTeamQueries,
    ArenasQueries,
    AvailabilityQueries,
    CreateMatchQueries,
    RecordResultQueries,
    GenerateFixturesQueries,
    GenerateNextRoundQueries,
    RescheduleMatchQueries,
    CancelMatchQueries,
    FinishQueries {}
export interface LeagueStore {
  readonly queries: LeagueSession;
  transaction<T>(work: (session: LeagueSession) => Promise<T>): Promise<T>;
}
