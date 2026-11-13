import { SectionHeading } from '../../../components/ui/SectionHeading';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import type { TeamMembership } from '../types/teams.types';

export function MyTeamsList({
  teams,
  onDetails,
  onChat,
}: {
  teams: TeamMembership[];
  onDetails: (team: TeamMembership) => void;
  onChat: (id: string) => void;
}) {
  return (
    <section className="my-4">
      <SectionHeading
        eyebrow="SEUS GRUPOS"
        title="Minhas equipes"
      />
      {!teams.length && (
        <Card className="border rounded-4 shadow-sm bg-body mb-4">
          <Card.Body>
            Você ainda não faz parte de uma equipe. Explore as opções abaixo
            para começar.
          </Card.Body>
        </Card>
      )}
      {teams.length > 0 && (
        <div className="row g-3 mb-4">
          {teams.map((team) => (
            <div
              className="col-md-6 col-xl-4"
              key={team.id}
            >
              <Card className="border rounded-4 shadow-sm h-100">
                <Card.Body>
                  {team.image ? (
                    <Image
                      width={52}
                      height={52}
                      className="object-fit-cover rounded-3 flex-shrink-0"
                      src={team.image}
                      alt={`Imagem da equipe ${team.name}`}
                    />
                  ) : (
                    <div className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary-emphasis p-3 rounded-3 fs-4">
                      <i className="bi bi-people-fill" />
                    </div>
                  )}
                  <span className="badge rounded-pill bg-success-subtle text-success-emphasis text-capitalize">
                    {team.role}
                  </span>
                  <h3 className="h5 fw-bold mt-3 mb-2">{team.name}</h3>
                  <p>{team.description || 'Equipe TechArena'}</p>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline-secondary"
                      onClick={() => onDetails(team)}
                    >
                      Detalhes e solicitações
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => onChat(team.id)}
                    >
                      Ir para conversa
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
