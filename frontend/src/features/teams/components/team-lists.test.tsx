import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MembershipRequest, Team, TeamMember, TeamMembership } from '../types/teams.types';
import { TeamCatalog } from './TeamCatalog';
import { MyTeamsList } from './MyTeamsList';
import { TeamInvitations } from './TeamInvitations';
import { TeamMembersList } from './TeamMembersList';

const team: Team = { id: 'team-1', name: 'Aurora', description: null, image: null, createdAt: '2026-01-01' };
const membership: TeamMembership = { id: 'team-1', name: 'Aurora', description: null, image: 'team.png', joinedAt: null, role: 'captain' };
const invitation: MembershipRequest = { id: 'invite-1', teamId: 'team-1', teamName: 'Aurora', userId: 'user-1', userName: 'Ana', createdBy: 'captain-1', kind: 'invitation', status: 'pending', createdAt: '2026-01-01' };

describe('team list states', () => {
  it('distinguishes loading, empty, and failed team catalog states', () => {
    const props = { teams: [], myTeamIds: new Set<string>(), pendingIds: new Set<string>(), onDetails: vi.fn(), onJoin: vi.fn() };
    const { rerender } = render(<TeamCatalog {...props} loading error={false} />);
    expect(screen.getByText('Carregando equipes...')).toBeInTheDocument();
    rerender(<TeamCatalog {...props} loading={false} error={false} />);
    expect(screen.getByText('Nenhuma equipe encontrada')).toBeInTheDocument();
    rerender(<TeamCatalog {...props} loading={false} error />);
    expect(screen.queryByText('Nenhuma equipe encontrada')).not.toBeInTheDocument();
  });

  it('allows eligible join requests and disables teams already joined or requested', () => {
    const onJoin = vi.fn();
    render(<TeamCatalog teams={[team, { ...team, id: 'joined', name: 'Minha equipe' }, { ...team, id: 'pending', name: 'Pendente' }]} loading={false} error={false} myTeamIds={new Set(['joined'])} pendingIds={new Set(['pending'])} onDetails={vi.fn()} onJoin={onJoin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar participação' }));
    expect(onJoin).toHaveBeenCalledWith(team);
    expect(screen.getByRole('button', { name: 'Você já participa' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Solicitação enviada' })).toBeDisabled();
    expect(screen.getAllByText('Uma equipe pronta para receber novos atletas.')).toHaveLength(3);
  });

  it('shows empty and populated membership cards with their navigation actions', () => {
    const onDetails = vi.fn();
    const onChat = vi.fn();
    const { rerender } = render(<MyTeamsList teams={[]} onDetails={onDetails} onChat={onChat} />);
    expect(screen.getByText(/Você ainda não faz parte de uma equipe/)).toBeInTheDocument();
    rerender(<MyTeamsList teams={[membership]} onDetails={onDetails} onChat={onChat} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir para conversa' }));
    expect(onChat).toHaveBeenCalledWith('team-1');
    expect(screen.getByAltText('Imagem da equipe Aurora')).toBeInTheDocument();
  });

  it('renders invitation responses and hides the invitation section when empty', () => {
    const onRespond = vi.fn();
    const { rerender } = render(<TeamInvitations invitations={[]} onRespond={onRespond} />);
    expect(screen.queryByText('Entre para uma equipe')).not.toBeInTheDocument();
    rerender(<TeamInvitations invitations={[invitation]} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(onRespond).toHaveBeenNthCalledWith(1, 'invite-1', 'accept');
    expect(onRespond).toHaveBeenNthCalledWith(2, 'invite-1', 'decline');
  });

  it('handles loading, empty, and mixed member roles', () => {
    const captain: TeamMember = { id: 'captain', name: null, username: null, image: null, role: 'captain', joinedAt: null };
    const player: TeamMember = { id: 'player', name: 'Bia', username: 'bia', image: null, role: 'member', joinedAt: null };
    const { rerender } = render(<TeamMembersList members={[]} loading />);
    expect(screen.getByText('Carregando membros...')).toBeInTheDocument();
    rerender(<TeamMembersList members={[]} loading={false} />);
    expect(screen.getByText('Nenhum membro encontrado.')).toBeInTheDocument();
    rerender(<TeamMembersList members={[captain, player]} loading={false} />);
    expect(screen.getByText('Atleta')).toBeInTheDocument();
    expect(screen.getByText('Capitão')).toBeInTheDocument();
    expect(screen.getByText('@bia')).toBeInTheDocument();
    expect(screen.getByText('Membro')).toBeInTheDocument();
  });
});
