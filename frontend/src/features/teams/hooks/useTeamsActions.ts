import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../api/teams.api';
import { queryKeys } from '../../../lib/query-client';
import type { MembershipRequest, Team, UserCard } from '../types/teams.types';
import type { TeamFormValues } from '../schemas/team.schema';
import type { TeamOverview } from '../components/TeamDetailsModal';

export function useTeamsActions(token: string, userId: string) {
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const invalidateLists = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['teams', userId] }),
      client.invalidateQueries({ queryKey: queryKeys.myTeams(userId) }),
      client.invalidateQueries({ queryKey: queryKeys.teamRequests(userId) }),
      client.invalidateQueries({
        queryKey: queryKeys.chatConversations(userId),
      }),
    ]);
  const createMutation = useMutation({
    mutationFn: (values: TeamFormValues) =>
      teamsApi.create(token, values.name, values.description),
    onSuccess: invalidateLists,
  });
  const joinMutation = useMutation({
    mutationFn: (teamId: string) => teamsApi.requestToJoin(token, teamId),
    onSuccess: invalidateLists,
  });
  const invitationMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'accept' | 'decline';
    }) => teamsApi.respondToInvitation(token, id, action),
    onSuccess: invalidateLists,
  });
  const inviteMutation = useMutation({
    mutationFn: ({
      teamId,
      userId: athleteId,
    }: {
      teamId: string;
      userId: string;
    }) => teamsApi.invite(token, teamId, athleteId),
    onSuccess: (_data, variables) =>
      client.invalidateQueries({
        queryKey: queryKeys.teamDetails(userId, variables.teamId),
      }),
  });
  const decideMutation = useMutation({
    mutationFn: ({
      teamId,
      userId: athleteId,
      action,
    }: {
      teamId: string;
      userId: string;
      action: 'accept' | 'decline';
    }) => teamsApi.decideRequest(token, teamId, athleteId, action),
    onSuccess: async (_data, variables) =>
      Promise.all([
        client.invalidateQueries({
          queryKey: queryKeys.teamDetails(userId, variables.teamId),
        }),
        invalidateLists(),
      ]),
  });

  async function run<T>(
    operation: () => Promise<T>,
    success?: string,
  ): Promise<T | undefined> {
    setError(null);
    setNotice(null);
    try {
      const value = await operation();
      if (success) setNotice(success);
      return value;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível concluir a operação.',
      );
      return undefined;
    }
  }
  const createTeam = (values: TeamFormValues) =>
    run(() => createMutation.mutateAsync(values), 'Equipe criada.');
  const requestJoin = (team: Pick<Team, 'id' | 'name'>) =>
    run(
      () => joinMutation.mutateAsync(team.id),
      `Solicitação enviada para ${team.name}.`,
    );
  const respondToInvitation = (id: string, action: 'accept' | 'decline') =>
    run(
      () => invitationMutation.mutateAsync({ id, action }),
      action === 'accept'
        ? 'Convite aceito. A equipe já aparece na sua lista.'
        : 'Convite recusado.',
    );
  async function inviteUser(team: TeamOverview | null, user: UserCard) {
    if (!team) return;
    setInvitingUserId(user.id);
    const result = await run(
      () => inviteMutation.mutateAsync({ teamId: team.id, userId: user.id }),
      `Convite enviado para ${user.name ?? user.username ?? 'atleta'}.`,
    );
    setInvitingUserId(null);
    return result;
  }
  async function decideTeamRequest(
    team: TeamOverview | null,
    request: MembershipRequest,
    action: 'accept' | 'decline',
  ) {
    if (!team) return;
    return run(
      () =>
        decideMutation.mutateAsync({
          teamId: team.id,
          userId: request.userId,
          action,
        }),
      action === 'accept'
        ? 'Solicitação aceita. O atleta entrou para a equipe.'
        : 'Solicitação recusada.',
    );
  }
  return {
    error,
    notice,
    setError,
    setNotice,
    invitingUserId,
    isCreating: createMutation.isPending,
    createTeam,
    requestJoin,
    respondToInvitation,
    inviteUser,
    decideTeamRequest,
  };
}
