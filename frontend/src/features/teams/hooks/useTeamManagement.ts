import { useConfirmation } from '../../../components/ui/useConfirmation';
import { useEffect } from 'react';
import { notifyFeedback } from '../../../components/ui/notify-feedback';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedSession } from '../../../auth/useAuthenticatedSession';
import { api } from '../../../lib/api-client';
export function useTeamManagement(
  teamId: string | undefined,
  onClose: () => void,
) {
  const { token, userId } = useAuthenticatedSession();
  const confirmation = useConfirmation();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (action: {
      kind: 'leave' | 'delete' | 'remove';
      userId?: string;
    }) => {
      if (!teamId) throw new Error('Equipe indisponível.');
      return action.kind === 'delete'
        ? api.deleteTeam(token, teamId)
        : action.kind === 'leave'
          ? api.leaveTeam(token, teamId)
          : api.removeTeamMember(token, teamId, action.userId!);
    },
    onSuccess: async (_result, action) => {
      await Promise.all(
        [
          'myTeams',
          'teams',
          'teamDetails',
          'chatConversations',
          'conversationMembers',
          'teamRequests',
        ].map((key) => client.invalidateQueries({ queryKey: [key, userId] })),
      );
      notifyFeedback(
        action.kind === 'delete'
          ? 'Equipe excluída.'
          : action.kind === 'leave'
            ? 'Você saiu da equipe.'
            : 'Membro removido.',
      );
      if (action.kind !== 'remove') onClose();
    },
  });
  const { reset } = mutation;
  useEffect(() => {
    reset();
  }, [reset, teamId]);
  const run = (kind: 'leave' | 'delete' | 'remove', userId?: string) => {
    const prompt =
      kind === 'delete'
        ? 'Excluir definitivamente esta equipe e seus convites?'
        : kind === 'leave'
          ? 'Sair desta equipe? Você perderá acesso à conversa.'
          : 'Remover este membro da equipe e da conversa?';
    confirmation.request({
      title:
        kind === 'delete'
          ? 'Excluir equipe'
          : kind === 'leave'
            ? 'Sair da equipe'
            : 'Remover membro',
      message: prompt,
      label:
        kind === 'delete' ? 'Excluir' : kind === 'leave' ? 'Sair' : 'Remover',
      onConfirm: () => mutation.mutateAsync({ kind, userId }),
    });
  };
  return { ...mutation, run, confirmation };
}
