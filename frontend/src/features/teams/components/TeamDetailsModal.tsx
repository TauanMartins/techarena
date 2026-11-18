import { ActionMenu } from '../../../components/ui/ActionMenu';
import { useTeamManagement } from '../hooks/useTeamManagement';
import { EditTeamForm } from './EditTeamForm';
import type { Team } from '../../../shared/types';
import type { SubmitEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';
import type {
  MembershipRequest,
  TeamMember,
  TeamMembership,
  TeamOverview,
  UserCard,
} from '../types/teams.types';
import { TeamMembersList } from './TeamMembersList';
import { TeamInvitePanel } from './TeamInvitePanel';

export type { TeamOverview } from '../types/teams.types';
interface TeamDetailsModalProps {
  team: TeamOverview | TeamMembership | null;
  members: TeamMember[];
  requests: MembershipRequest[];
  candidates: UserCard[];
  loading: boolean;
  search: string;
  invitingUserId: string | null;
  joined: boolean;
  requestPending: boolean;
  onUpdated?: (team: Team) => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onInvite: (candidate: UserCard) => void;
  onDecideRequest: (
    request: MembershipRequest,
    action: 'accept' | 'decline',
  ) => void;
  onRequestJoin: (team: TeamOverview) => void;
  onOpenChat: (teamId: string) => void;
}

export function TeamDetailsModal(props: TeamDetailsModalProps) {
  const {
    team,
    members,
    requests,
    candidates,
    loading,
    search,
    invitingUserId,
    joined,
    requestPending,
    onClose,
    onSearchChange,
    onSearchSubmit,
    onInvite,
    onDecideRequest,
    onRequestJoin,
    onOpenChat,
  } = props;
  const management = useTeamManagement(team?.id, onClose);
  return (
    <>
      {management.confirmation.dialog}
      <Modal
        show={team !== null && !management.confirmation.open}
        onHide={onClose}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{team?.name ?? 'Equipe'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {team && (
            <>
              {team.image && (
                <Image
                  className="w-100 object-fit-contain rounded-3 mb-3"
                  src={team.image}
                  alt={`Imagem da equipe ${team.name}`}
                />
              )}
              <p>
                {team.description || 'Esta equipe ainda não tem uma descrição.'}
              </p>
              <p className="text-secondary">
                {team.role
                  ? `Você participa como ${team.role === 'captain' ? 'capitão' : 'membro'}`
                  : 'Explore a equipe e solicite participação para entrar.'}
              </p>
              {joined && (
                <div className="d-flex align-items-center justify-content-between gap-3 border rounded-3 p-3 mb-3">
                  <span>Combine os próximos jogos com o grupo.</span>
                  <Button onClick={() => onOpenChat(team.id)}>
                    Conversar com a equipe
                  </Button>
                </div>
              )}
              {team.role === 'captain' && props.onUpdated && (
                <EditTeamForm
                  key={team.id}
                  team={team}
                  onSaved={props.onUpdated}
                />
              )}
              <hr />
              <TeamMembersList
                members={members}
                loading={loading}
                busy={management.isPending}
                onRemove={
                  team.role === 'captain'
                    ? (id) => management.run('remove', id)
                    : undefined
                }
              />
              {team.role === 'captain' && (
                <TeamInvitePanel
                  members={members}
                  requests={requests}
                  candidates={candidates}
                  search={search}
                  invitingUserId={invitingUserId}
                  onSearchChange={onSearchChange}
                  onSearchSubmit={onSearchSubmit}
                  onInvite={onInvite}
                  onDecideRequest={onDecideRequest}
                />
              )}
              {!team.role && (
                <Button
                  variant={joined ? 'outline-success' : 'outline-primary'}
                  disabled={joined || requestPending}
                  onClick={() => onRequestJoin(team)}
                >
                  {' '}
                  {joined
                    ? 'Você já participa'
                    : requestPending
                      ? 'Solicitação enviada'
                      : 'Solicitar participação'}
                </Button>
              )}
            </>
          )}
        </Modal.Body>
        {team && joined && (
          <Modal.Footer>
            <ActionMenu
              label="Gerenciar equipe"
              disabled={management.isPending}
              actions={[
                team.role === 'captain'
                  ? {
                      label: 'Excluir equipe',
                      icon: 'bi-trash',
                      danger: true,
                      onClick: () => management.run('delete'),
                    }
                  : {
                      label: 'Sair da equipe',
                      icon: 'bi-box-arrow-right',
                      danger: true,
                      onClick: () => management.run('leave'),
                    },
              ]}
            />
            <Button
              variant="outline-primary"
              onClick={() => onOpenChat(team.id)}
            >
              Ir para conversa
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
}
