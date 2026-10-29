import Form from 'react-bootstrap/Form';
import type { LeagueSummary, Sport } from '../../shared/types';

export function LeagueSettingsFields({
  prefix,
  sports,
  league,
  lockedFormat = false,
}: {
  prefix: string;
  sports?: Sport[];
  league?: Pick<
    LeagueSummary,
    | 'name'
    | 'description'
    | 'tournamentFormat'
    | 'groupCount'
    | 'qualifiersPerGroup'
  >;
  lockedFormat?: boolean;
}) {
  return (
    <div className="row g-3">
      <Form.Group
        className={sports ? 'col-md-5' : 'col-md-6'}
        controlId={`${prefix}-name`}
      >
        <Form.Label>Nome</Form.Label>
        <Form.Control
          name="name"
          required
          maxLength={45}
          defaultValue={league?.name ?? ''}
        />
      </Form.Group>
      {sports && (
        <Form.Group className="col-md-4" controlId={`${prefix}-sport`}>
          <Form.Label>Modalidade</Form.Label>
          <Form.Select name="sportId" required defaultValue="">
            <option value="" disabled>
              Selecione o esporte
            </option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}
      <Form.Group
        className={sports ? 'col-md-3' : 'col-md-6'}
        controlId={`${prefix}-description`}
      >
        <Form.Label>Descrição</Form.Label>
        <Form.Control
          name="description"
          maxLength={500}
          defaultValue={league?.description ?? ''}
          placeholder={sports ? 'Opcional' : undefined}
        />
      </Form.Group>
      <Form.Group className="col-md-4" controlId={`${prefix}-format`}>
        <Form.Label>Formato</Form.Label>
        <Form.Select
          name="tournamentFormat"
          defaultValue={league?.tournamentFormat ?? 'round_robin'}
          disabled={lockedFormat}
        >
          <option value="round_robin">Pontos corridos</option>
          <option value="knockout">Eliminação simples</option>
          <option value="groups_knockout">Grupos + mata-mata</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="col-md-4" controlId={`${prefix}-groups`}>
        <Form.Label>Grupos</Form.Label>
        <Form.Control
          name="groupCount"
          type="number"
          min={2}
          max={16}
          defaultValue={league?.groupCount ?? 2}
          disabled={lockedFormat}
        />
      </Form.Group>
      <Form.Group className="col-md-4" controlId={`${prefix}-qualifiers`}>
        <Form.Label>Classificados por grupo</Form.Label>
        <Form.Control
          name="qualifiersPerGroup"
          type="number"
          min={1}
          max={8}
          defaultValue={league?.qualifiersPerGroup ?? 2}
          disabled={lockedFormat}
        />
      </Form.Group>
    </div>
  );
}
