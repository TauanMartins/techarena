import { ToastNotice } from '../components/ui/ToastNotice';
import { useAuth } from '../auth/useAuth';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/ui/Feedback';
import { LeagueMatchList } from '../features/leagues/components/LeagueMatchList';
import { LeagueOverview } from '../features/leagues/components/LeagueOverview';
import { LeagueScheduleForms } from '../features/leagues/components/LeagueScheduleForms';
import { LeagueSettingsPanel } from '../features/leagues/components/LeagueSettingsPanel';
import { LeagueStandingsTable } from '../features/leagues/components/LeagueStandingsTable';
import { LeagueTeamsPanel } from '../features/leagues/components/LeagueTeamsPanel';
import { useLeagueWorkspace } from '../features/leagues/hooks/useLeagueWorkspace';

import { Link, useParams } from 'react-router-dom';
export function LeagueDetailsPage() {
  const { session } = useAuth();
  const { leagueId = '' } = useParams();
  const page = useLeagueWorkspace(
    session!.access_token,
    session!.user.id,
    leagueId,
  );
  const { data } = page;
  const details = data.details;
  return (
    <>
      <Link
        to="/ligas"
        className="btn btn-link px-0 mb-3"
      >
        ← Voltar para ligas
      </Link>
      {page.error && <ErrorState message={page.error} />}
      {page.notice && <ToastNotice message={page.notice} />}
      {data.isLoadingDetails ? (
        <LoadingState label="Carregando detalhes da liga..." />
      ) : !details ? (
        <EmptyState
          icon="bi-trophy"
          title="Liga indisponível"
          description="Não foi possível abrir esta liga. Volte para escolher outra competição."
        />
      ) : (
        <>
          <LeagueOverview league={details.league} />
          {details.league.isOwner &&
            ['open', 'active'].includes(details.league.status) && (
              <LeagueSettingsPanel
                league={details.league}
                saving={page.saving}
                onSubmit={page.updateLeague}
                onStatus={(status) => void page.updateStatus(status)}
              />
            )}
          <LeagueTeamsPanel
            league={details.league}
            details={details}
            eligibleTeams={page.eligibleTeams}
            teamSearch={page.teamSearch}
            searchPerformed={page.teamSearchPerformed}
            inviteTeamId={page.inviteTeamId}
            teamId={page.teamId}
            teamSearchResults={data.teamSearchResults}
            invitableTeams={page.invitableTeams}
            searching={data.isSearchingTeams}
            saving={page.saving}
            onRegister={(event) => void page.registerTeam(event)}
            onTeamChange={page.setTeamId}
            onInviteTeamChange={page.setInviteTeamId}
            onSearchChange={(value) => {
              page.setTeamSearch(value);
              page.setTeamSearchPerformed(false);
            }}
            onSearch={(event) => page.searchTeams(event)}
            onInvite={(event) => void page.inviteTeam(event)}
            onRemove={(id) => void page.removeTeam(id)}
          />
          <LeagueScheduleForms
            league={details.league}
            teams={details.teams}
            matchesCount={details.matches.length}
            arenas={data.leagueArenas}
            arenaId={data.selectedArenaId}
            date={page.matchDate}
            schedules={data.availability}
            saving={page.saving}
            onDateChange={page.setMatchDate}
            onArenaChange={page.setArenaId}
            onGenerate={(event, nextRound) =>
              void page.generateFixtures(event, nextRound)
            }
            onSchedule={(event) => void page.scheduleMatch(event)}
          />
          <LeagueMatchList
            matches={details.matches}
            isOwner={details.league.isOwner}
            date={page.matchDate}
            arenas={data.leagueArenas}
            arenaId={data.selectedArenaId}
            availability={data.availability}
            scores={page.scoreInputs}
            saving={page.saving}
            reschedulingId={page.reschedulingId}
            onScoreChange={(matchId, side, value) =>
              page.setScoreInputs((current) => ({
                ...current,
                [matchId]: { ...current[matchId], [side]: value },
              }))
            }
            onSaveResult={page.saveResult}
            onCancel={page.cancelMatch}
            onToggleReschedule={(id) =>
              page.setReschedulingId((current) => (current === id ? '' : id))
            }
            onDateChange={page.setMatchDate}
            onArenaChange={page.setArenaId}
            onReschedule={page.rescheduleMatch}
          />
          <LeagueStandingsTable
            standings={details.standings}
            league={details.league}
          />
        </>
      )}
    </>
  );
}
