import type { SubmitEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type {
  LeagueArena,
  LeagueSummary,
  LeagueTeam,
} from '../types/leagues.types';
import type { Schedule } from '../../../shared/types';
import { localDate } from '../date';

interface ScheduleProps {
  league: LeagueSummary;
  teams: LeagueTeam[];
  matchesCount: number;
  arenas: LeagueArena[];
  arenaId: string;
  date: string;
  schedules: Schedule[];
  saving: boolean;
  onDateChange: (date: string) => void;
  onArenaChange: (id: string) => void;
  onGenerate: (
    event: SubmitEvent<HTMLFormElement>,
    nextRound?: boolean,
  ) => void;
  onSchedule: (event: SubmitEvent<HTMLFormElement>) => void;
}

function MatchTimeFields({
  arenas,
  arenaId,
  date,
  schedules,
  onDateChange,
  onArenaChange,
  prefix,
}: Pick<
  ScheduleProps,
  'arenas' | 'arenaId' | 'date' | 'schedules' | 'onDateChange' | 'onArenaChange'
> & { prefix: string }) {
  return (
    <div className="row g-3">
      <Form.Group
        className="col-md-4"
        controlId={`${prefix}-date`}
      >
        <Form.Label>Data da primeira partida</Form.Label>
        <Form.Control
          type="date"
          min={localDate()}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          required
        />
      </Form.Group>
      <Form.Group
        className="col-md-4"
        controlId={`${prefix}-arena`}
      >
        <Form.Label>Arena</Form.Label>
        <Form.Select
          value={arenaId}
          onChange={(event) => onArenaChange(event.target.value)}
          required
        >
          {arenas.map((arena) => (
            <option
              key={arena.id}
              value={arena.id}
            >
              {arena.address}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group
        className="col-md-4"
        controlId={`${prefix}-schedule`}
      >
        <Form.Label>Horário disponível</Form.Label>
        <Form.Select
          name="scheduleId"
          required
          defaultValue=""
        >
          <option
            value=""
            disabled
          >
            Selecione um horário
          </option>
          {schedules.map((schedule) => (
            <option
              key={schedule.id}
              value={schedule.id}
            >
              {schedule.horary.slice(0, 5)}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

function FixtureForm({
  title,
  nextRound = false,
  ...props
}: ScheduleProps & { title: string; nextRound?: boolean }) {
  return (
    <Card className="border rounded-4 shadow-sm bg-body mb-4">
      <Card.Body>
        <h3 className="h4">{title}</h3>
        {!props.arenas.length ? (
          <p className="text-secondary mb-0">
            Ainda não há arenas disponíveis para esta modalidade.
          </p>
        ) : (
          <Form onSubmit={(event) => props.onGenerate(event, nextRound)}>
            <MatchTimeFields
              {...props}
              prefix={nextRound ? 'next-round' : 'fixtures'}
            />
            <Row className="mt-3">
              <Form.Group
                as={Col}
                xs={12}
                md={4}
                controlId={`${nextRound ? 'next-round' : 'fixtures'}-interval`}
              >
                <Form.Label>Intervalo entre partidas (dias)</Form.Label>
                <Form.Control
                  name="daysBetweenMatches"
                  type="number"
                  min={1}
                  max={30}
                  defaultValue={1}
                  required
                />
              </Form.Group>
            </Row>
            {!nextRound && (
              <p className="small text-secondary mt-2">
                O calendário agenda uma partida por data, no mesmo horário e
                arena.
              </p>
            )}
            <Button
              className="mt-3"
              type="submit"
              disabled={props.saving || !props.schedules.length}
            >
              {nextRound ? 'Gerar próxima fase' : 'Gerar calendário'}
            </Button>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

export function LeagueScheduleForms(props: ScheduleProps) {
  const canGenerate =
    props.league.isOwner &&
    props.league.status === 'open' &&
    props.teams.length >= 2 &&
    props.matchesCount === 0;
  const canAdvance =
    props.league.isOwner &&
    props.league.status === 'active' &&
    props.league.tournamentFormat !== 'round_robin';
  const canSchedule =
    props.league.isOwner &&
    ['open', 'active'].includes(props.league.status) &&
    props.teams.length >= 2;
  return (
    <>
      {canGenerate && (
        <FixtureForm
          {...props}
          title="Gerar calendário"
        />
      )}
      {canAdvance && (
        <>
          <p className="text-secondary">
            A próxima fase só poderá ser criada após registrar todos os
            resultados da fase atual.
          </p>
          <FixtureForm
            {...props}
            title="Avançar torneio"
            nextRound
          />
        </>
      )}
      {canSchedule && (
        <Card className="border rounded-4 shadow-sm bg-body mb-4">
          <Card.Body>
            <h3 className="h4">Agendar partida</h3>
            {!props.arenas.length ? (
              <p className="text-secondary mb-0">
                Ainda não há arenas disponíveis para esta modalidade.
              </p>
            ) : (
              <Form onSubmit={props.onSchedule}>
                <div className="row g-3">
                  <Form.Group
                    className="col-md-6"
                    controlId="league-home-team"
                  >
                    <Form.Label>Equipe da casa</Form.Label>
                    <Form.Select
                      name="homeTeamId"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Selecione
                      </option>
                      {props.teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                        >
                          {team.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group
                    className="col-md-6"
                    controlId="league-away-team"
                  >
                    <Form.Label>Equipe visitante</Form.Label>
                    <Form.Select
                      name="awayTeamId"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Selecione
                      </option>
                      {props.teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                        >
                          {team.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group
                    className="col-md-4"
                    controlId="league-match-date"
                  >
                    <Form.Label>Data</Form.Label>
                    <Form.Control
                      type="date"
                      min={localDate()}
                      value={props.date}
                      onChange={(event) =>
                        props.onDateChange(event.target.value)
                      }
                      required
                    />
                  </Form.Group>
                  <Form.Group
                    className="col-md-4"
                    controlId="league-match-arena"
                  >
                    <Form.Label>Arena</Form.Label>
                    <Form.Select
                      value={props.arenaId}
                      onChange={(event) =>
                        props.onArenaChange(event.target.value)
                      }
                      required
                    >
                      {props.arenas.map((arena) => (
                        <option
                          key={arena.id}
                          value={arena.id}
                        >
                          {arena.address}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group
                    className="col-md-4"
                    controlId="league-match-time"
                  >
                    <Form.Label>Horário da partida</Form.Label>
                    <Form.Select
                      name="scheduleId"
                      required
                      defaultValue=""
                    >
                      <option
                        value=""
                        disabled
                      >
                        Selecione
                      </option>
                      {props.schedules.map((schedule) => (
                        <option
                          key={schedule.id}
                          value={schedule.id}
                        >
                          {schedule.horary.slice(0, 5)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                {!props.schedules.length && (
                  <p className="text-secondary mt-2 mb-0">
                    Não há horários disponíveis para a data e arena escolhidas.
                  </p>
                )}
                <Button
                  className="mt-3"
                  type="submit"
                  disabled={props.saving || !props.schedules.length}
                >
                  Agendar partida
                </Button>
              </Form>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
}
