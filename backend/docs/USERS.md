# Migração do contexto user

Todas as rotas abaixo exigem `Authorization: Bearer <access_token Supabase>`. O usuário
vem exclusivamente do `sub` validado. Não há parâmetros username, userId ou e-mail
para escolher de quem alterar o perfil, as preferências ou os vínculos.

| Rota atual | Função |
|---|---|
| `GET /users?search=...&page=1&limit=20` | Busca paginada de cards públicos; sem e-mail, nascimento ou permissão |
| `POST /users/me` | Inicializa perfil, idempotente, retorna 200; corpo vazio `{}` |
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
  `POST /users/me` substitui somente a inicialização do perfil. O cliente não fornece
  ID, e-mail ou permissão. A permissão inicial é user quando o seed existe, nunca admin.
- `GET /users` preserva a busca por username e também aceita nome, com mínimo de dois
  caracteres, máximo de 50 itens por página e parâmetros de busca vinculados ao SQL.
- `GET /users/team` corresponde à lista atual de equipes. O esquema atual `user_team`
  tem apenas vínculo/role; não possui estados de convite, pedido ou aceite. Portanto,
  `POST/PUT /users/team` não foram recriados: permitir ingresso automático nesse ponto
  aprovaria pedidos indevidamente. Um fluxo de aprovação exige modelagem e regras
  explícitas no contexto de equipes.
- `PUT /users/theme` é substituído pelo caminho de preferências do próprio usuário.
- `GET/POST/PUT /sports/prefered-sports` são consolidados em GET/PUT dos favoritos
  do usuário. A troca é atômica, exige IDs existentes e no máximo quatro distintos.
- `POST /users/appointments` migra para o vínculo com o próprio usuário. A criação
  de vínculos de chat foi removida porque não existem tabelas de chat nesse esquema.
  Consultas de recomendações por distância/modalidade não são equivalentes a listar
  participações e pertencem ao contexto de agendamentos.

Não foram criados aliases inseguros para as rotas antigas. Listas usam envelopes
`{ items, total, page, limit }`; favoritos usam `{ items }`. IDs bigint são strings.

## Regras

O perfil inicia sem nascimento ou username inventados. Um PATCH vazio é inválido.
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
