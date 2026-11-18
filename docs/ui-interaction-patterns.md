# Componentes e feedback

Use React Bootstrap para comportamento e apresentação de controles compartilhados. Utilitários Bootstrap têm preferência; CSS específico fica junto da funcionalidade quando não houver utilitário equivalente.

## Avisos

`ToastNotice` usa `Toast`, `Toast.Header`, `Toast.Body` e `ToastContainer` do React Bootstrap.

| Situação                                                                                                             | Comportamento                                                            |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Preferências, perfil, criação ou edição comum                                                                        | Toast de sucesso, desaparece em 6 segundos; fechamento manual disponível |
| Falha de operação                                                                                                    | Toast persistente com botão **Entendi**                                  |
| Exclusão/saída de equipe, remoção de membro, bloqueio/desfazer amizade, cancelamento/encerramento de liga ou partida | Confirmação antes da ação; sucesso persistente com **Entendi**           |

`requiresAcknowledgment` explicita os sucessos importantes. `notifyFeedback` atende operações que fecham sua tela de origem; `FeedbackNotifications` mantém uma fila para não substituir mensagens ainda não confirmadas. Não renderize também um aviso inline para a mesma operação.

## Ações e formulários

- A ação principal fica visível: conversar, aceitar, salvar e registrar resultado.
- Ações secundárias múltiplas podem usar `ActionMenu`. Uma ação isolada aparece diretamente, com nome acessível e ícone.
- Exclusão/saída da equipe tem botão explícito no rodapé; remover um integrante tem controle contextual ao lado dele.
- `useConfirmation` usa `Modal` e `Button`, incluindo estado ocupado e cancelamento. Não use `window.confirm` ou `window.alert`.
- `NumberStepper` compõe `InputGroup`, `Form.Control` e botões para placares, mantendo edição direta, teclado e limites. É um incremento numérico, não um fluxo de etapas.

## Sessão

Telas protegidas usam `useAuthenticatedSession` para obter token atualizado e identidade da conta. `apiRequest` continua sendo o único ponto que define o cabeçalho Authorization. O `userId` nas chaves React Query separa caches de contas diferentes; não é uma segunda autenticação. Providers que também funcionam sem login mantêm o tratamento explícito de sessão opcional.

## Exclusão de equipes e publicação

A migração `1793154000000-archive-teams` deve rodar no banco do backend **antes** da nova versão do backend atender requisições. Em ambiente compilado, utilize o procedimento existente `npm run db:migrate:prod` na pasta backend; não é necessária variável nova.

A exclusão lógica remove membros e solicitações e revoga o chat, preservando a equipe referenciada por resultados antigos. Liga aberta ou em andamento bloqueia a exclusão; liga encerrada ou cancelada não bloqueia. Nomes das equipes arquivadas podem ser reutilizados. Por isso, reverter a migração exige resolver previamente eventuais nomes duplicados entre registros ativos e arquivados; o índice antigo recusará a reversão sem apagar dados silenciosamente.

## Quadras e horários

O formulário de agendamento começa pela quadra, com até dez opções e distância quando a localização está disponível. O mapa permite explorar todos os resultados dos filtros, buscando todas as páginas da API; a paginação fica apenas nas listagens. Selecionar uma quadra restringe os esportes às modalidades cadastradas nela.

Novos agendamentos e partidas interpretam data e horário de funcionamento em `America/Sao_Paulo` (Brasília) e persistem o instante em UTC. A consulta de disponibilidade usa a mesma conversão. Instantes já gravados não são reinterpretados. O modelo ainda não possui fuso por arena.

Os toasts ficam no topo central abaixo de 768 px e no canto inferior direito a partir desse tamanho. Fundo opaco, borda e recorte dos cantos usam utilitários Bootstrap e respeitam o tema.
