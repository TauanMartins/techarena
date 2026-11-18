import { useState, type SubmitEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import type { LeagueSummary } from '../types/leagues.types';
import { LeagueSettingsFields } from './LeagueSettingsFields';

export function LeagueSettingsPanel({
  league,
  saving,
  onSubmit,
  onStatus,
}: {
  league: LeagueSummary;
  saving: boolean;
  onSubmit: (
    event: SubmitEvent<HTMLFormElement>,
  ) => Promise<boolean | undefined>;
  onStatus: (status: 'completed' | 'canceled') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  return (
    <Card className="border rounded-4 shadow-sm bg-body mb-4">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between gap-2">
          <h3 className="h4 mb-0">Gerenciar liga</h3>
          <Button
            variant="outline-primary"
            aria-label={editing ? 'Fechar edição da liga' : 'Editar liga'}
            disabled={saving}
            onClick={() => {
              setEditing(!editing);
              setDirty(false);
            }}
          >
            <i
              className={`bi ${editing ? 'bi-x-lg' : 'bi-pencil'}`}
              aria-hidden="true"
            />{' '}
            {editing ? 'Fechar' : 'Editar'}
          </Button>
        </div>
        {editing && (
          <>
            {league.matchCount > 0 && (
              <p className="small text-body-secondary mt-3">
                Nome e descrição podem ser editados. O formato da competição
                fica bloqueado após o agendamento das partidas.
              </p>
            )}
            <Form
              onSubmit={async (event) => {
                if (await onSubmit(event)) {
                  setEditing(false);
                  setDirty(false);
                }
              }}
              onChange={(event) => {
                const values = new FormData(event.currentTarget);
                setDirty(
                  [
                    'name',
                    'description',
                    ...(league.matchCount === 0
                      ? ['tournamentFormat', 'groupCount', 'qualifiersPerGroup']
                      : []),
                  ].some(
                    (key) =>
                      String(values.get(key) ?? '') !==
                      String(league[key as keyof LeagueSummary] ?? ''),
                  ),
                );
              }}
              noValidate
            >
              <LeagueSettingsFields
                prefix="edit-league"
                league={league}
                lockedFormat={league.matchCount > 0}
              />
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button
                  type="submit"
                  disabled={saving || !dirty}
                >
                  Salvar configurações
                </Button>
                {league.status === 'active' && (
                  <Button
                    type="button"
                    variant="success"
                    disabled={saving}
                    onClick={() => onStatus('completed')}
                  >
                    Encerrar liga
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline-danger"
                  disabled={saving}
                  onClick={() => onStatus('canceled')}
                >
                  Cancelar liga
                </Button>
              </div>
            </Form>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
