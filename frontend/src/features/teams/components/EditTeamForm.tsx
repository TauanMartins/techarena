import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useAuthenticatedSession } from '../../../auth/useAuthenticatedSession';
import { teamsApi } from '../api/teams.api';
import { teamFormSchema, type TeamFormValues } from '../schemas/team.schema';
import type { Team, TeamMembership } from '../../../shared/types';
import { TeamNameAvailability } from './TeamNameAvailability';
export function EditTeamForm({
  team,
  onSaved,
}: {
  team: Pick<TeamMembership, 'id' | 'name' | 'description' | 'image'>;
  onSaved: (team: Team) => void;
}) {
  const { token, userId } = useAuthenticatedSession();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? '');
  const [validation, setValidation] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (values: TeamFormValues) =>
      teamsApi.update(
        token,
        team.id,
        values.name,
        values.description ?? '',
        team.image,
      ),
    onSuccess: async (updated) => {
      onSaved(updated);
      setEditing(false);
      await Promise.all(
        [
          'teams',
          'myTeams',
          'chatConversations',
          'teamDetails',
          'leagueDetails',
        ].map((key) => client.invalidateQueries({ queryKey: [key, userId] })),
      );
    },
  });
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = teamFormSchema.safeParse({ name, description });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0].message);
      return;
    }
    setValidation(null);
    mutation.mutate(parsed.data);
  }
  if (!editing)
    return (
      <Button
        className="mb-3"
        variant="outline-secondary"
        onClick={() => {
          setName(team.name);
          setDescription(team.description ?? '');
          setValidation(null);
          mutation.reset();
          setEditing(true);
        }}
      >
        Editar equipe
      </Button>
    );
  return (
    <Form
      onSubmit={submit}
      className="border rounded-3 p-3 mb-3"
    >
      <h3 className="h6">Editar equipe</h3>
      {(validation || mutation.error) && (
        <p
          role="alert"
          className="text-danger"
        >
          {validation ?? mutation.error?.message}
        </p>
      )}
      <Form.Group
        controlId="edit-team-name"
        className="mb-3"
      >
        <Form.Label>Nome da equipe</Form.Label>
        <Form.Control
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={45}
          required
        />
        <TeamNameAvailability
          name={name}
          currentName={team.name}
        />
      </Form.Group>
      <Form.Group
        controlId="edit-team-description"
        className="mb-3"
      >
        <Form.Label>Descrição da equipe</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Form.Group>
      <div className="d-flex gap-2">
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar equipe'}
        </Button>
        <Button
          variant="outline-secondary"
          disabled={mutation.isPending}
          onClick={() => setEditing(false)}
        >
          Cancelar edição
        </Button>
      </div>
    </Form>
  );
}
