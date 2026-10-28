# Migração do contexto user

Todas as rotas abaixo exigem `Authorization: Bearer <access_token Supabase>`. O usuário
vem exclusivamente do `sub` validado. Não há parâmetros username, userId ou e-mail
para escolher de quem alterar o perfil, as preferências ou os vínculos.

| Rota atual | Função |
|---|---|
| `GET /users?search=...&page=1&limit=20` | Busca paginada de cards públicos; sem e-mail, nascimento ou permissão |
| `GET /users/me` | Perfil privado e permissão de aplicação somente para leitura |
| `PATCH /users/me` | Atualiza nome, username, nascimento, gênero e imagem |
| `GET /users/me/theme` | Lê tema; padrão system |
| `PUT /users/me/theme` | Substitui tema (light, dark ou system) |
| `GET /users/me/sports` | Lista esportes favoritos |
| `PUT /users/me/sports` | Substitui todos os favoritos, incluindo lista vazia |
| `GET /users/me/teams` | Lista vínculos efetivos com equipes, paginados |
| `GET /users/me/appointments` | Lista participações em agendamentos, paginadas |
| `POST /users/me/appointments/:appointmentId` | Inscreve em agendamento futuro; holder padrão true |

## Decisões de migração

- O login de `POST /users` e `POST /users/admin` fica no frontend com Supabase Auth.
  O backend não autentica ID tokens do Google nem concede administração por rota.
  O perfil é criado pelo trigger externo de `auth.users` em `public.users`. A API
  não oferece criação de perfil e não atribui permissão automaticamente.
- `GET /users` preserva a busca por username e também aceita nome, com mínimo de dois
  caracteres, máximo de 50 itens por página e parâmetros de busca vinculados ao SQL.
- A lista de equipes continua em `GET /users/me/teams` e contém somente vínculos
  efetivos. A etapa de migração de equipes adicionou estados em uma tabela própria
  e os fluxos explícitos de convite/solicitação, descritos em [WORKFLOWS.md](WORKFLOWS.md).
  Os caminhos antigos `POST/PUT /users/team` continuam sem alias inseguro.
- `PUT /users/theme` é substituído pelo caminho de preferências do próprio usuário.
- `GET/POST/PUT /sports/prefered-sports` são consolidados em GET/PUT dos favoritos
  do usuário. A troca é atômica, exige IDs existentes e no máximo quatro distintos.
- `POST /users/appointments` migra para o vínculo com o próprio usuário. A criação
  de vínculos de chat foi removida porque não existem tabelas de chat nesse esquema.
  Consultas de recomendações por distância/modalidade não são equivalentes a listar
  participações e pertencem ao contexto de agendamentos.

Não foram criados aliases inseguros para as rotas antigas. Listas usam envelopes
`{ items, total, page, limit, totalPages, hasNextPage, hasPreviousPage }`;
favoritos usam `{ items, maxFavorites, remainingSlots }`. IDs bigint são strings.

## Regras

O backend consulta o perfil existente e não inventa nascimento ou username. Um PATCH vazio é inválido.
Nome não pode ficar vazio, username usa letras minúsculas/dígitos/underscore (3–45),
e a imagem aceita URL HTTPS de até 150 caracteres, conforme o banco atual. Dados
pessoais podem permanecer nulos enquanto o cadastro estiver incompleto. A imagem
pode ser apagada com null. E-mail e permissão não são editáveis por esse contrato.

A idade mínima de 18 anos do legado foi preservada: nascimento fornecido precisa
representar um adulto. Para participar de agendamentos, é obrigatório completar esse
campo. O backend não fabrica um nascimento para contornar a regra.

A admissão aceita apenas agendamentos scheduled, futuros e não excluídos; duplicatas
recebem 409. `max_players` limita titulares (`holder=true`); reservas não ocupam essas
vagas. O teste de concorrência confirma que duas inscrições disputando uma vaga
produzem uma inscrição e um conflito. A listagem oculta agendamentos excluídos.

Erros de validação/regra retornam 400, identidade inválida 401, perfil/referência
inexistente 404, conflitos 409 e indisponibilidade de autenticação 503. DTOs de saída
são projetados e validados antes da serialização; falha de contrato é 500 sem dados
internos. Os limites de tamanho e nulabilidade das tabelas continuam aplicáveis.

## Perfil criado pelo Supabase Auth

Após o login, use diretamente `GET /users/me`. O UUID verificado no token é usado
para procurar `public.users.id`. Um token válido sem registro correspondente recebe
404 com código `PROFILE_NOT_FOUND`, sem criação automática ou instrução de POST.
`POST /users/me` não existe nem aparece no Swagger.

O trigger externo deve inserir em **`public.users`**, nome definido pelas migrations
e pela entity atual. O SQL antigo com `public.user` aponta para outra tabela. Como o
trigger apresentado não define `permission_id`, o perfil pode ter permissão nula;
nenhuma permissão é inferida do token ou atribuída automaticamente pela API.

O trigger só modifica o banco onde está instalado. Para usá-lo como fonte única,
`DATABASE_URL` precisa apontar para esse mesmo banco. Se a API usa o PostgreSQL local
do Compose enquanto Auth está na nuvem, não há sincronização automática de perfis.
Nesse cenário é necessário provisionamento controlado nesse banco ou uma integração
explícita de sincronização; esta alteração não instala nenhum desses mecanismos.
Os testes de integração simulam o perfil já criado usando fixtures no banco isolado.

## Filtros e respostas revisados

Os caminhos existentes foram preservados. As opções novas são opcionais e as
respostas mantêm os campos anteriores, acrescentando informações de navegação e contexto.
A busca pública continua sem e-mail, nascimento ou permissão.

| Endpoint | Opções de consulta |
|---|---|
| `GET /users` | `search` obrigatório (2–100 caracteres), `searchBy=all\|username\|name`, `sortBy=username\|name`, `sortOrder=asc\|desc` |
| `GET /users/me/teams` | `search` opcional pelo nome da equipe (2–100), `role=captain\|member`, `sortBy=joinedAt\|name`, `sortOrder=asc\|desc` |
| `GET /users/me/appointments` | `status=scheduled\|in_progress\|finished\|canceled`, `holder=true\|false`, `from`, `to`, `sortOrder=asc\|desc` |

Todos usam `page` (1–10000, padrão 1) e `limit` (1–50, padrão 20). Ordenação padrão:
username crescente na busca, ingresso crescente em equipes, agendamento decrescente
nas participações. Empates têm um segundo critério por ID; valores nulos ficam ao
final. Os campos usados no ORDER BY vêm de uma lista fixa no servidor.

Busca trata `%`, `_` e barra invertida como caracteres literais. O texto é enviado
como parâmetro SQL; valores de ordenação e campos desconhecidos são rejeitados.
O filtro de equipes continua limitado aos vínculos do próprio usuário, mesmo quando
um nome ou papel é informado. Convites/pedidos não são tratados como membros efetivos.

`from` e `to` são limites inclusivos sobre `scheduledAt` e exigem data/hora ISO 8601
com timezone explícito, por exemplo `2030-01-01T00:00:00Z`. Um intervalo invertido
retorna 400. `holder=false` realmente seleciona reservas: não usa conversão por
truthiness. Agendamentos excluídos continuam ocultos em todas as combinações.

Os cards de equipes agora incluem `description`, `image` e `joinedAt` (este pode
ser nulo nos vínculos antigos). As respostas de agendamentos, tanto na inscrição
quanto na consulta, incluem `description`, `organizerId`, `isOrganizer` e `maxPlayers`.
Não é necessário consultar outro perfil para identificar o próprio organizador.

Exemplo de paginação:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

Favoritos incluem `maxFavorites: 4` e `remainingSlots`, calculados pela mesma política
que limita a escrita. Uma lista com dois esportes deixa duas escolhas disponíveis;
substituir por `[]` remove os favoritos e retorna quatro escolhas disponíveis.

No PATCH de perfil, nome e username têm espaços externos removidos. A validação e a
seleção dos campos editáveis também acontecem no domínio, além dos DTOs; dados de
identidade/permissão continuam bloqueados. O backend não cria registros ausentes.

## Organização dos subcontextos

O Swagger agrupa as rotas em `users/profile`, `users/directory`, `users/theme`,
`users/favorite-sports`, `users/team-memberships` e `users/appointment-memberships`.
Módulos e detalhes de dependência estão em [ARCHITECTURE.md](ARCHITECTURE.md).
