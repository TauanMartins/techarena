import { useAuth } from "../auth/useAuth";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "../components/ui/Feedback";
import { LeagueCatalog } from "../features/leagues/components/LeagueCatalog";
import { LeagueCreatePanel } from "../features/leagues/components/LeagueCreatePanel";
import { LeagueInvitations } from "../features/leagues/components/LeagueInvitations";
import { LeagueMatchList } from "../features/leagues/components/LeagueMatchList";
import { LeagueOverview } from "../features/leagues/components/LeagueOverview";
import { LeagueScheduleForms } from "../features/leagues/components/LeagueScheduleForms";
import { LeagueSettingsPanel } from "../features/leagues/components/LeagueSettingsPanel";
import { LeagueStandingsTable } from "../features/leagues/components/LeagueStandingsTable";
import { LeagueTeamsPanel } from "../features/leagues/components/LeagueTeamsPanel";
import { useLeagueWorkspace } from "../features/leagues/hooks/useLeagueWorkspace";

export function LeaguePage() {
  const { session } = useAuth();
  const page = useLeagueWorkspace(session!.access_token, session!.user.id);
  const { data } = page;
  const details = data.details;

  return <>
    <PageHeading eyebrow="COMPETIÇÃO E COMUNIDADE" title="Ligas e torneios" description="Crie competições, inscreva equipes, agende partidas e acompanhe a classificação." action={<Button onClick={() => page.setShowCreate((current) => !current)}><i className="bi bi-plus-lg me-2" aria-hidden="true" />{page.showCreate ? "Fechar" : "Criar liga"}</Button>} />
    {page.error && <ErrorState message={page.error} />}
    {page.notice && <Alert variant="success" dismissible onClose={() => page.setNotice(null)}>{page.notice}</Alert>}
    <LeagueInvitations invitations={data.teamInvitations} saving={page.saving} onRespond={(id, action) => void page.respondInvitation(id, action)} />
    {page.showCreate && <LeagueCreatePanel sports={data.sports} saving={page.saving} onSubmit={(event) => void page.createLeague(event)} />}
    {data.isLoading ? <LoadingState label="Carregando ligas..." /> : data.leagues.length === 0 ? <EmptyState icon="bi-trophy" title="Nenhuma liga criada" description="Crie uma liga para começar a organizar equipes e partidas." /> : <div className="row g-4">
      <LeagueCatalog leagues={data.leagues} selectedId={data.selectedLeagueId} onSelect={page.selectLeague} />
      <section className="col-lg-8" aria-live="polite">{data.isLoadingDetails ? <LoadingState label="Carregando detalhes da liga..." /> : !details ? <EmptyState icon="bi-trophy" title="Selecione uma liga" description="Escolha uma liga para ver equipes, partidas e classificação." /> : <>
        <LeagueOverview league={details.league} />
        {details.league.isOwner && ["open", "active"].includes(details.league.status) && <LeagueSettingsPanel league={details.league} saving={page.saving} onSubmit={(event) => void page.updateLeague(event)} onStatus={(status) => void page.updateStatus(status)} />}
        <LeagueTeamsPanel league={details.league} details={details} eligibleTeams={page.eligibleTeams} teamSearch={page.teamSearch} searchPerformed={page.teamSearchPerformed} inviteTeamId={page.inviteTeamId} teamId={page.teamId} teamSearchResults={data.teamSearchResults} invitableTeams={page.invitableTeams} searching={data.isSearchingTeams} saving={page.saving} onRegister={(event) => void page.registerTeam(event)} onTeamChange={page.setTeamId} onInviteTeamChange={page.setInviteTeamId} onSearchChange={(value) => { page.setTeamSearch(value); page.setTeamSearchPerformed(false); }} onSearch={(event) => page.searchTeams(event)} onInvite={(event) => void page.inviteTeam(event)} onRemove={(id) => void page.removeTeam(id)} />
        <LeagueScheduleForms league={details.league} teams={details.teams} matchesCount={details.matches.length} arenas={data.leagueArenas} arenaId={data.selectedArenaId} date={page.matchDate} schedules={data.availability} saving={page.saving} onDateChange={page.setMatchDate} onArenaChange={page.setArenaId} onGenerate={(event, nextRound) => void page.generateFixtures(event, nextRound)} onSchedule={(event) => void page.scheduleMatch(event)} />
        <LeagueMatchList matches={details.matches} isOwner={details.league.isOwner} date={page.matchDate} arenas={data.leagueArenas} arenaId={data.selectedArenaId} availability={data.availability} scores={page.scoreInputs} saving={page.saving} reschedulingId={page.reschedulingId} onScoreChange={(matchId, side, value) => page.setScoreInputs((current) => ({ ...current, [matchId]: { ...current[matchId], [side]: value } }))} onSaveResult={page.saveResult} onCancel={page.cancelMatch} onToggleReschedule={(id) => page.setReschedulingId((current) => current === id ? "" : id)} onDateChange={page.setMatchDate} onArenaChange={page.setArenaId} onReschedule={page.rescheduleMatch} />
        <LeagueStandingsTable standings={details.standings} league={details.league} />
      </>}</section>
    </div>}
  </>;
}
