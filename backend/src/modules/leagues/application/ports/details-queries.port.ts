import type {
  LeagueMatchView,
  LeagueStanding,
  LeagueTeamInvitationView,
  LeagueTeamView,
} from '../../domain/league.js';
export interface DetailsQueries {
  detailsListTeams(leagueId: string): Promise<LeagueTeamView[]>;
  detailsListMatches(leagueId: string): Promise<LeagueMatchView[]>;
  detailsListStandings(leagueId: string): Promise<LeagueStanding[]>;
  detailsListCaptainTeams(
    leagueId: string,
    actor: string,
  ): Promise<{ teamId: string }[]>;
  detailsListInvitations(leagueId: string): Promise<LeagueTeamInvitationView[]>;
}
