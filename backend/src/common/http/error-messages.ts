const domainErrorMessages: Record<string, string> = {
  'A conflicting record already exists': 'Este registro já existe.',
  'A match requires two different teams':
    'Uma partida exige duas equipes diferentes.',
  'A membership decision is already pending':
    'Já existe uma decisão pendente para esta solicitação.',
  'A referenced record is missing or in use':
    'Um registro relacionado não foi encontrado ou está em uso.',
  'A relationship already exists': 'Esta relação já existe.',
  'A result can only be recorded after a scheduled match':
    'O resultado só pode ser registrado após o agendamento da partida.',
  'A team with scheduled matches cannot be removed':
    'Uma equipe com partidas agendadas não pode ser removida.',
  'A tournament requires between 2 and 64 teams':
    'O torneio deve ter entre 2 e 64 equipes.',
  'All group matches must have a result before qualification':
    'Todas as partidas dos grupos devem ter resultado antes da classificação.',
  'All scheduled matches and the tournament final must be completed before closing the league':
    'Todas as partidas agendadas e a final do torneio devem ser concluídas antes de encerrar a liga.',
  'An invitation for this team is already pending':
    'Já existe um convite pendente para esta equipe.',
  'Arena not found': 'Arena não encontrada.',
  'Both teams must be registered in this league':
    'As duas equipes devem estar inscritas nesta liga.',
  'Choose 2–16 groups and 1–8 qualifiers per group; group qualifiers must form a power-of-two bracket':
    'Escolha de 2 a 16 grupos e de 1 a 8 classificados por grupo. O total de classificados deve formar uma chave com quantidade de equipes igual a uma potência de 2.',
  'Choose an arena reserved for leagues and supporting this sport':
    'Escolha uma arena reservada para ligas e que ofereça suporte a este esporte.',
  'Competition settings cannot change after matches have been scheduled':
    'As configurações da competição não podem ser alteradas após o agendamento de partidas.',
  'Days between matches must be between 1 and 30':
    'O intervalo entre partidas deve ser de 1 a 30 dias.',
  'Every match in the current knockout round needs a winner before advancing':
    'Todas as partidas da fase eliminatória atual precisam ter um vencedor antes do avanço.',
  'Fixtures can only be generated for an open league':
    'O calendário só pode ser gerado para uma liga com inscrições abertas.',
  'Fixtures have already been generated':
    'O calendário de partidas já foi gerado.',
  'Friend relationship not found': 'Relação de amizade não encontrada.',
  'Friend request is not pending':
    'A solicitação de amizade não está pendente.',
  'Generate the initial fixtures before advancing':
    'Gere o calendário inicial antes de avançar.',
  'Invalid pagination or sorting options':
    'As opções de paginação ou ordenação são inválidas.',
  'Knockout matches must have a winner':
    'Partidas eliminatórias precisam ter um vencedor.',
  'League invitation not found': 'Convite para a liga não encontrado.',
  'League name cannot be empty': 'O nome da liga não pode ficar vazio.',
  'League not found': 'Liga não encontrada.',
  'League team not found': 'Equipe da liga não encontrada.',
  'Match not found': 'Partida não encontrada.',
  'Matches cannot be changed after the league has been closed':
    'As partidas não podem ser alteradas após o encerramento da liga.',
  'Matches cannot be scheduled after the league has been closed':
    'Não é possível agendar partidas após o encerramento da liga.',
  'Membership request not found': 'Solicitação de participação não encontrada.',
  'Membership request was already decided':
    'Esta solicitação de participação já foi respondida.',
  'No group standings are available':
    'A classificação dos grupos ainda não está disponível.',
  'One or more sports do not exist': 'Um ou mais esportes não existem.',
  'Only a team captain can perform this action':
    'Somente o capitão da equipe pode realizar esta ação.',
  'Only a team captain can respond to this invitation':
    'Somente o capitão da equipe pode responder a este convite.',
  'Only future matches without results can be canceled':
    'Somente partidas futuras sem resultado podem ser canceladas.',
  'Only future matches without results can be rescheduled':
    'Somente partidas futuras sem resultado podem ser reagendadas.',
  'Only the league organizer can invite teams':
    'Somente o organizador da liga pode convidar equipes.',
  'Only the league organizer can record match results':
    'Somente o organizador da liga pode registrar resultados.',
  'Only the league organizer can schedule matches':
    'Somente o organizador da liga pode agendar partidas.',
  'Only the league organizer or a team captain can register a team':
    'Somente o organizador da liga ou o capitão da equipe pode inscrever uma equipe.',
  'Only the league organizer or a team captain can remove a team':
    'Somente o organizador da liga ou o capitão da equipe pode remover uma equipe.',
  'Only the organizer can cancel this match':
    'Somente o organizador pode cancelar esta partida.',
  'Only the organizer can edit this league':
    'Somente o organizador pode editar esta liga.',
  'Only the organizer can finish this league':
    'Somente o organizador pode encerrar esta liga.',
  'Only the organizer can generate a tournament round':
    'Somente o organizador pode gerar uma fase do torneio.',
  'Only the organizer can generate fixtures':
    'Somente o organizador pode gerar o calendário de partidas.',
  'Only the organizer can reschedule this match':
    'Somente o organizador pode reagendar esta partida.',
  'Only the receiving party can decide this membership request':
    'Somente o destinatário pode responder a esta solicitação de participação.',
  'Only the recipient can accept the request':
    'Somente o destinatário pode aceitar a solicitação.',
  'Pending membership request not found':
    'Solicitação de participação pendente não encontrada.',
  'Provide a valid YYYY-MM-DD date':
    'Informe uma data válida no formato AAAA-MM-DD.',
  'Provide an address and distinct supported sports':
    'Informe um endereço e esportes compatíveis sem duplicidade.',
  'Rescheduling cannot change the competing teams':
    'O reagendamento não pode alterar as equipes participantes.',
  'Results cannot be changed after the league has been closed':
    'Os resultados não podem ser alterados após o encerramento da liga.',
  'Schedule not found': 'Horário não encontrado.',
  'Scores must be non-negative integers':
    'Os placares devem ser números inteiros não negativos.',
  'Single elimination requires a power-of-two number of teams':
    'A eliminação simples exige uma quantidade de equipes igual a uma potência de 2.',
  'Sport not found': 'Esporte não encontrado.',
  'Supply valid latitude and longitude together; radius requires a location':
    'Informe latitude e longitude válidas em conjunto. O raio exige uma localização.',
  'Team not found': 'Equipe não encontrada.',
  'Teams can only be invited while registrations are open':
    'As equipes só podem ser convidadas enquanto as inscrições estiverem abertas.',
  'Teams can only be registered while league registrations are open':
    'As equipes só podem ser inscritas enquanto as inscrições da liga estiverem abertas.',
  'Teams can only be removed while league registrations are open':
    'As equipes só podem ser removidas enquanto as inscrições da liga estiverem abertas.',
  'Teams must divide evenly into groups, with at least two teams per group and a power-of-two qualifier count smaller than each group':
    'As equipes devem ser divididas igualmente entre os grupos, com pelo menos duas equipes por grupo. A quantidade de classificados deve ser menor que o tamanho de cada grupo e igual a uma potência de 2.',
  'The final has already been completed': 'A final já foi concluída.',
  'The invited user must answer this invitation':
    'O usuário convidado deve responder a este convite.',
  'The league has no active tournament': 'A liga não possui um torneio ativo.',
  'The league has no sport configured':
    'A liga não possui um esporte configurado.',
  'The league sport no longer exists':
    'O esporte associado à liga não está mais disponível.',
  'The qualifying teams do not form a complete knockout bracket':
    'As equipes classificadas não formam uma chave eliminatória completa.',
  'The selected arena and time are no longer available':
    'A arena e o horário selecionados não estão mais disponíveis.',
  'The selected arena is not available for this league':
    'A arena selecionada não está disponível para esta liga.',
  'The selected slot has already started': 'O horário selecionado já começou.',
  'This arena does not support the sport':
    'Esta arena não oferece suporte a este esporte.',
  'This arena is restricted to league scheduling':
    'Esta arena é exclusiva para agendamentos de ligas.',
  'This friendship does not belong to you':
    'Esta relação de amizade não pertence a você.',
  'This invitation has already been answered':
    'Este convite já foi respondido.',
  'This league is already closed': 'Esta liga já foi encerrada.',
  'This league is no longer accepting teams':
    'Esta liga não está mais aceitando equipes.',
  'This legacy league is missing its organizer or sport':
    'Esta liga antiga não possui organizador ou esporte definido.',
  'This team has no captain who can respond to the invitation':
    'Esta equipe não possui um capitão que possa responder ao convite.',
  'This team is already registered': 'Esta equipe já está inscrita.',
  'Tournament fixtures must be rescheduled or the league canceled to preserve the bracket':
    'Para preservar a chave do torneio, reagende as partidas ou cancele a liga.',
  'Use the league status action to finish or cancel a league':
    'Use a opção de status da liga para encerrá-la ou cancelá-la.',
  'User is already a member': 'O usuário já é membro.',
  'User not found': 'Usuário não encontrado.',
  'You cannot add yourself': 'Você não pode adicionar a si mesmo.',
};

const validationMessages: Record<string, string> = {
  'Invalid or expired access token': 'O token de acesso é inválido ou expirou.',
  'A ****** token is required':
    'É necessário informar um token de acesso válido.',
  'Authentication is unavailable':
    'O serviço de autenticação está indisponível.',
  'Database migrations pending':
    'O banco de dados ainda possui migrações pendentes.',
  'Response contract violation':
    'O servidor não conseguiu processar a resposta da solicitação.',
  Unauthorized: 'Autentique-se para continuar.',
  Forbidden: 'Você não tem permissão para realizar esta ação.',
  'Not Found': 'O recurso solicitado não foi encontrado.',
  'Bad Request': 'Os dados enviados são inválidos.',
  'Internal Server Error':
    'Não foi possível concluir a solicitação. Tente novamente.',
};

const localizedMessagePrefixes = [
  'A autenticação',
  'A arena',
  'A equipe',
  'A solicitação',
  'As equipes',
  'As partidas',
  'Este ',
  'Esta ',
  'O acesso',
  'O banco',
  'O horário',
  'O serviço',
  'Os dados',
  'Somente ',
  'Seu ',
  'Sua ',
  'Todas ',
  'Um ',
  'Uma ',
  'Você ',
  'Não ',
];

export function translateErrorMessage(
  message: string,
  status?: number,
): string {
  const knownTranslation =
    domainErrorMessages[message] ?? validationMessages[message];
  if (knownTranslation) return knownTranslation;

  const unavailableSlot = message.match(/^The arena is unavailable at (.+)$/);
  if (unavailableSlot) {
    return `A arena não está disponível em ${unavailableSlot[1]}.`;
  }

  if (
    localizedMessagePrefixes.some((prefix) => message.startsWith(prefix)) ||
    /[áàâãéêíóôõúüç]/i.test(message)
  ) {
    return message;
  }
  return status === undefined
    ? 'Não foi possível concluir a solicitação. Tente novamente.'
    : errorMessageForStatus(status);
}

export function errorMessageForStatus(status: number): string {
  if (status === 400) return 'Os dados enviados são inválidos.';
  if (status === 401) return 'Autentique-se para continuar.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'O recurso solicitado não foi encontrado.';
  if (status === 409)
    return 'Esta operação não pode ser concluída neste momento.';
  if (status === 503) return 'O serviço está temporariamente indisponível.';
  return 'Não foi possível concluir a solicitação. Tente novamente.';
}
