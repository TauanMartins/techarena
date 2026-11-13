import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import type { SubmitEvent } from 'react';
import type { Team } from '../types/teams.types';
import { EmptyState, LoadingState } from '../../../components/ui/Feedback';

export function TeamCatalog({
  teams,
  loading,
  error,
  myTeamIds,
  pendingIds,
  onDetails,
  onJoin,
}: {
  teams: Team[];
  loading: boolean;
  error: boolean;
  myTeamIds: Set<string>;
  pendingIds: Set<string>;
  onDetails: (team: Team) => void;
  onJoin: (team: Team) => void;
}) {
  return (
    <section className="my-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <span className="d-block small fw-semibold text-body-secondary mb-1">
            COMUNIDADE
          </span>
          <h2 className="h5 fw-bold mb-0">Encontrar equipes</h2>
        </div>
      </div>
      {loading && <LoadingState label="Carregando equipes..." />}
      {!loading && !error && !teams.length && (
        <EmptyState
          icon="bi-people"
          title="Nenhuma equipe encontrada"
          description="Tente outra busca ou crie uma nova equipe."
        />
      )}
      {!loading && teams.length > 0 && (
        <div className="row g-3">
          {teams.map((team) => {
            const joined = myTeamIds.has(team.id);
            const requested = pendingIds.has(team.id);
            return (
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
                    <h3 className="h5 fw-bold mt-3 mb-2">{team.name}</h3>
                    <p>
                      {team.description ||
                        'Uma equipe pronta para receber novos atletas.'}
                    </p>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline-secondary"
                        onClick={() => onDetails(team)}
                      >
                        Detalhes
                      </Button>
                      <Button
                        variant={joined ? 'outline-success' : 'outline-primary'}
                        disabled={joined || requested}
                        onClick={() => onJoin(team)}
                      >
                        {joined
                          ? 'Você já participa'
                          : requested
                            ? 'Solicitação enviada'
                            : 'Solicitar participação'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function TeamSearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <Form
      className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 border rounded-4 bg-body shadow-sm p-3 mb-4"
      onSubmit={onSubmit}
    >
      <i
        className="bi bi-search"
        aria-hidden="true"
      />
      <Form.Control
        aria-label="Buscar equipes"
        placeholder="Buscar equipe pelo nome"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        type="submit"
        variant="outline-primary"
      >
        Buscar
      </Button>
    </Form>
  );
}
