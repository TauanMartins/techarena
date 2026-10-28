# Migração de horários, agendamentos, esportes, arenas, equipes e amizades

Todas as rotas exigem Bearer do Supabase. O autor de uma operação vem do token;
`username`, `username_owner`, `username_user_1` e outros seletores de autor não são
aceitos. Dados são validados na entrada e projetados/validados por DTOs na saída.
Os contratos do NestJS usam camelCase e IDs bigint como strings.

## Rotas migradas

| Rota | Contrato principal |
|---|---|
| `GET /horary` | Query `sportId`, `arenaId`, `date` (YYYY-MM-DD); retorna `{items:[{id,horary}]}` |
| `GET /appointments` | Descoberta de agendamentos futuros scheduled, com paginação |
| `GET /appointments/user` | Participações do usuário autenticado, incluindo histórico |
| `POST /appointments` | Reserva e inscrição do organizador em uma transação |
| `GET /sports` | Catálogo paginado; `search` opcional |
| `GET /sports/arena` | Modalidades da arena; query `arenaId` |
| `GET /sports/material` | Materiais e `relatedToLocal`; query `sportId` |
| `GET /team` | Busca paginada de equipes; `search` opcional |
| `GET /team/exist` | Query `name`; retorna `{exists:boolean}`, comparação sem diferenciar caixa/espaços externos |
| `POST /team` | Corpo `name`, `description?`, `image?`; cria vínculo captain para o autor |
| `PUT /team` | Corpo `teamId`, `name`, `description?`, `image?`; somente capitão |
| `POST /team/user` | Corpo `teamId`, `userId`; capitão convida o destinatário, sem adicioná-lo ao time |
| `PUT /team/user` | Corpo `teamId`, `userId`, `action?` accept/decline (padrão accept); capitão decide solicitação de ingresso |
| `GET /friend` | Grupos paginados `friends`, `requestedFriends`, `receivedFriends` |
| `POST /friend` | Corpo `userId`; cria solicitação, retorna 200 e a relação criada |
| `PUT /friend` | Corpo `friendId`, `action?` accept/block (padrão accept) |
| `GET /arenas` | Catálogo paginado de arenas não exclusivas de liga |
| `GET /arenas/sports` | Query obrigatória `sportId` |
| `GET /arenas/users` | Catálogo com localização opcional, distância e raio |
| `POST /arenas` | Somente administrador; cria arena e modalidades em transação |
| `PUT /arenas` | Somente administrador; altera arena e sincroniza modalidades em transação |
| `GET /arenas/admin` | Somente administrador; inclui arenas exclusivas de liga |

Listas usam `{items,total,page,limit,totalPages,hasNextPage,hasPreviousPage}` com
`page=1` e `limit=20` por padrão; limite máximo 50. Os grupos de amizades usam esse
envelope separadamente, com a mesma página/limite para cada grupo. Cada amizade inclui
seu ID para decisões e um card público da outra pessoa, sem e-mail ou nascimento.

A consulta `/users/me/appointments` já existente é mantida como visão de vínculos
com filtros próprios. `/appointments/user` preserva a consulta do contexto de
agendamentos com dados de arena/modalidade, distância e preferência esportiva.
As outras rotas já migradas de usuários não são duplicadas ou removidas.

## Arenas e catálogos

A criação/edição de arena usa `address`, `lat` (-90 a 90), `longitude` (-180 a 180),
`sportIds` (lista não vazia, distinta, de modalidades existentes), `isLeagueOnly`
(padrão false) e `image?` (URL HTTPS ou null, até 150 caracteres). A edição recebe
também `arenaId` e representa substituição dos campos enviados no contrato PUT.
As coordenadas de escrita são números JSON, não trechos de SQL.

A listagem permite `search` por endereço, `sportId` e o par opcional `lat`/`longitude`.
Com coordenadas, retorna `distanceKm` e ordena por proximidade; sem coordenadas,
distância é null. `radiusKm` exige o par e aceita até 1000 km. A busca por modalidade
usa `sportId` obrigatório. A rota `/arenas/users` mantém a função de catálogo com
esses filtros; o legado recebia coordenadas mas não as usava.

A autorização administrativa usa `permission.slug=admin` do perfil persistido, nunca
metadata do JWT. Uma relação arena/modalidade usada em agendamentos não pode ser
apagada: a edição retorna 409 e a transação preserva arena e vínculos anteriores.
Não há upload AWS: `image` deve ser URL de arquivo já armazenado, por exemplo no
Storage pelo frontend. O backend não busca essa URL nem implementa upload neste fluxo.

## Horários e agendamentos

```json
{
  "arenaId": "1",
  "sportId": "1",
  "scheduleId": "25",
  "date": "2030-11-01",
  "title": "Vôlei à tarde",
  "description": "Levar água",
  "holder": true,
  "maxPlayers": 12
}
```

`title`, `description`, `holder` e `maxPlayers` são opcionais. O título padrão é o
nome da modalidade limitado ao tamanho da coluna; o limite padrão de titulares é
`default_value_player_numbers` da modalidade. `holder` é true por padrão. O perfil
do organizador deve estar completo para a regra de maioridade já existente.

Os horários da tabela schedule e o campo date compõem um instante **UTC**. A resposta
`scheduledAt` é ISO 8601. A reserva deve ser futura, ter modalidade suportada pela arena
e horário existente. Arenas exclusivas de liga não aceitam reservas por esse fluxo.
A disponibilidade exclui horários passados e reservas scheduled/in_progress ativas.
Reservas canceladas ou excluídas liberam o horário. A consulta não garante reserva:
a confirmação depende da transação de criação e da constraint de unicidade.

O bloqueio da arena e um índice único impedem duas reservas na mesma arena/instante,
inclusive para modalidades diferentes. O organizador é inscrito junto com a reserva;
se a criação falhar, não fica vínculo parcial. Não são criados chats legados.
A ocupação de titulares continua respeitando a política já existente nas inscrições.

As duas consultas de agendamentos aceitam `sportId`, `arenaId`, `lat`, `longitude`,
`radiusKm`, `preferSports` (true/false), `orderByTime` (recent/future) e `distance`
(near/far). Preferências priorizam modalidades favoritas, sem excluir as demais.
`recent` ordena o instante crescente e `future` decrescente, preservando as opções do
legado. Com coordenadas, a distância tem prioridade após a preferência esportiva.
Valores de busca/posição são vinculados como parâmetros, nunca interpolados no SQL.

Os cards incluem arena, modalidade, horário, contagens de participantes/titulares,
`isInside` e distância opcional. Agendamentos antigos sem vínculo conhecido continuam
com `arenaId`, `sportId` e `scheduleId` nulos; não são fabricados vínculos para eles.

## Consentimento em equipes

Um convite não cria `user_team`. A migration adiciona `team_membership_request` com
kind invitation/request e status pending/accepted/declined. Há no máximo uma decisão
pendente por par equipe/usuário; somente o aceite insere o membro com role member.
O índice de nomes normalizados também impede equipes duplicadas em criações concorrentes.

Para completar os dois lados do fluxo legado, foram adicionadas estas rotas:

- `GET /team/user?teamId=...`: capitão consulta pendências da equipe.
- `POST /users/me/team-requests` com `teamId`: membro solicita ingresso.
- `GET /users/me/team-requests`: usuário consulta suas pendências.
- `PUT /users/me/team-invitations/:requestId` com `action=accept|decline`: destinatário responde ao convite.

Capitães decidem pedidos de ingresso em `PUT /team/user`; não podem aceitar o convite
que eles próprios enviaram em nome do destinatário. Terceiros não podem decidir.
Aceites concorrentes são serializados e criam somente um vínculo. Recusa não cria
membro e permite uma nova pendência futura. Para aceitar ou solicitar ingresso é
necessário o perfil adulto; recusar um convite exige apenas perfil existente.

## Amizades

Solicitações a si mesmo são rejeitadas. Uma relação existente, inclusive invertida
ou bloqueada, impede nova criação. O índice não ordenado já existente protege a
concorrência. Só o destinatário aceita uma solicitação pending; remetentes e terceiros
não podem se passar por ele. Qualquer parte pode bloquear sua relação. Relações
bloqueadas não aparecem nos três grupos, e não existe desbloqueio implícito por POST.

## Migration e execução

Execute `npm run db:migrate` no banco escolhido antes de chamar os novos endpoints.
A migration `SupportLegacyWorkflows1793150000000` acrescenta vínculos opcionais dos
agendamentos, estados de pedidos de equipe e índices de integridade. `scheduled_at`
passa a timestamptz, interpretando os valores anteriores como UTC, conforme o contrato
do backend. Bases importadas de outro fuso precisam dessa reconciliação antes de aplicar.
Nomes de equipes já duplicados devem ser resolvidos explicitamente: a migration falha
nessa situação e não apaga nem renomeia dados automaticamente.

A comparação entities/esquema e o rollback/reaplicação foram testados em banco
isolado. Rollback remove os novos vínculos e o histórico de pedidos; use-o apenas
em banco descartável. O histórico de migrations anteriores foi preservado.

Os testes de integração exigem banco com sufixo `_test` e são executados por arquivo
sequencialmente, pois compartilham o banco. Testes usam tokens assinados com chaves
locais de teste e verificam autorização, consentimento, concorrência, rollback de
transações, geolocalização, horários UTC e presença das rotas no OpenAPI.

A regressão de coluna ausente também é testada contra PostgreSQL real: rollback da
migration de workflows reproduz `42703`, impede o bootstrap e faz o health reportar
503. Outro caso renomeia uma coluna com histórico atualizado e verifica a detecção.
Testes de queries percorrem páginas preenchidas/vazias, filtros geográficos, ambas
as ordenações temporais/distância e preferência esportiva com joins/subqueries.
O catálogo de equipes e os vínculos pessoais têm schemas Swagger distintos.
