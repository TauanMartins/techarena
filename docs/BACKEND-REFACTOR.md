# Laravel → NestJS: rastreabilidade de comportamento

Referência A: `backend.old/routes/api.php`, controllers de `backend.old/app/Http/Controllers` e funcionalidades de `backend.old/TechArena/Funcionalities`. Referência B: backend Nest na base da branch `codex/backend-hexagonal-zod`. C é a implementação em andamento nesta branch; a tabela descreve critérios de aceitação, não certifica que todas as etapas já foram implementadas.

## Decisões transversais

- Identidade vem do JWT verificado, nunca de username/email informado no body. A intenção de agir pelo usuário é preservada, sem restaurar a possibilidade de impersonação do Laravel.
- Catálogo, relações, preferências e torneios continuam no PostgreSQL da aplicação. Autenticação e mensagens/realtime continuam no Supabase já utilizado pelo cliente.
- A criação física antecipada de chats no Laravel passa a provisionamento idempotente sob demanda no Supabase. O direito de acesso nasce da participação persistida. Não substituir isso por chamadas de rede dentro de uma transação SQL.
- Erros de entrada são 400, ausência 404, falta de acesso 403, conflito 409. Não reproduzir o catch genérico que convertia tudo em 404 e expunha exceções.
- Ids bigint via HTTP continuam strings; datas de calendário não são instantes; instantes são ISO UTC. Evitar coerção que transforme string vazia em zero ou "false" em true.
- Regras de estado são funções/modelos de domínio puros. Casos de uso coordenam autorização, leituras e gravações através de portas. Adapters implementam HTTP, TypeORM, locks e Supabase. Consultas podem retornar projeções sem criar agregados artificiais.
- Validações dependentes de estado devem ocorrer dentro da mesma transação/lock da gravação. Constraints continuam sendo a última proteção concorrente.
- Não alterar schema de produção nem rodar migrations de produção durante esta refatoração.

## Requisições, uma a uma

| A: requisição Laravel | Intenção original e fragilidade | B: correspondente atual | C: melhoria/critério de aceitação |
|---|---|---|---|
| GET /health-check | Disponibilidade e conexão; expunha tabelas/erros internos | GET /health | Status, versão e readiness de migrations; indisponibilidade 503 sem inventário do banco |
| GET /horary | Horários livres por arena/modalidade/data | GET /horary | Contrato de data real; respeitar vínculo, arena exclusiva, início e colisão entre modalidades |
| GET /appointments/user | Meus eventos, preferências, proximidade e tempo | GET /appointments/user | Identidade autenticada, filtros explícitos, paginação estável |
| GET /appointments | Descoberta dos eventos e favoritos | GET /appointments | Preservar preferSports/orderByTime/distance e cálculo geográfico parametrizado |
| POST /appointments | Criar evento + organizador participante + acesso ao chat atomicamente | POST /appointments | Caso de uso transacional; política de horário/capacidade/defaults; acesso ao chat decorrente da participação |
| GET /sports | Catálogo de modalidades | GET /sports | Query simples com paginação e contrato de resposta |
| GET /sports/arena | Modalidades da arena | GET /sports/arena | Id validado e consulta do relacionamento |
| GET /sports/material | Materiais exigidos para modalidade | GET /sports/material | Preservar vínculo e projeção paginada |
| GET /team | Buscar equipes pelo nome | GET /team | Busca escapada, ordenação estável, resposta documentada |
| GET /team/exist | Verificar disponibilidade de nome | GET /team/exist | Boolean explícito; unicidade normalizada garantida também no banco |
| POST /team | Equipe + capitão + chat; imagem via S3 | POST /team | Transação para equipe/capitão; URL de imagem segura, preservar acesso do capitão ao chat |
| PUT /team | Apenas proprietário edita; preservar imagem não alterada | PUT /team | Autorizar capitão no contexto transacional; normalizar dados no domínio |
| POST /team/user | Capitão convida usuário | POST /team/user | Máquina de estados distingue invitation de request; convite não concede participação |
| PUT /team/user | Capitão aceita solicitação e libera chat | PUT /team/user | Apenas capitão decide request pendente; participação atômica e convite não autoaceitável |
| GET /friend | Amigos, enviados e recebidos | GET /friend | Preservar os três grupos com identidade do token |
| POST /friend | Pedido sem duplicação | POST /friend | Proibir autoamizade, tratar par simétrico e concorrência |
| PUT /friend | Destinatário aceita | PUT /friend | Política explícita de aceitação/bloqueio e revogação de acesso ao chat |
| GET /message | Mensagens paginadas por cursor somente para participante | Supabase chat/realtime + POST /chat/access | Preservar paginação e autorização; RLS é obrigatória, não apenas autorização na UI |
| POST /message | Persistir mensagem e transmitir aos demais | Supabase chat/realtime | Persistência/realtime pelo cliente autorizado, sem restaurar broadcast PHP paralelo |
| GET /chat/group/detail | Detalhes de grupo autorizado | Contexto de equipe/evento + Supabase | Direito derivado da participação atual; não confiar só no registro remoto |
| GET /chat/private/detail | Detalhes privados autorizado | Contexto de amizade + Supabase | Amizade aceita e identidade participante |
| GET /chat | Conversas separadas por amigo/equipe/evento | Frontend compõe contextos + Supabase | Preservar três contextos; registrar substituição, não declarar endpoint equivalente inexistente |
| POST /chat | Abrir/reusar conversa privada | POST /chat/access (direct) | Tópico canônico, par autorizado, provisionamento idempotente |
| POST /chat/team | Abrir conversa da equipe | POST /chat/access (team) | Participação persistida; não aceitar mero convite pendente |
| POST /chat/appointment | Abrir conversa do evento | POST /chat/access (appointment) | Organizador/participante e evento não excluído |
| GET /arenas | Catálogo | GET /arenas | Query paginada, política de visibilidade de arenas exclusivas |
| GET /arenas/sports | Arenas compatíveis com modalidade | GET /arenas/sports | Mesmo contrato base + sportId obrigatório |
| GET /arenas/users | Arenas próximas ao usuário | GET /arenas/users | Coordenadas válidas em par; raio e ordenação estável |
| POST /arenas | Arena + modalidades atomicamente; imagem S3 | POST /arenas | Admin autenticado; validação de vínculos; URL segura; transação |
| PUT /arenas | Alterar arena e reconciliar modalidades | PUT /arenas | Não remover vínculos usados por eventos ativos; lock compartilhado com reservas |
| GET /arenas/admin | Catálogo administrativo (Laravel não impunha papel no controller) | GET /arenas/admin | Exigir admin e permitir visão administrativa sem expor dados privados |
| GET /users | Buscar pessoas | GET /users | Projeção pública sem email/permissões/dados de nascimento |
| GET /users/team | Equipes aceitas e pedidos recebidos/enviados | GET /users/me/teams + GET /users/me/team-requests | Estados explícitos; nenhum pedido pendente vira membro |
| POST /users/team | Usuário solicita entrada | POST /users/me/team-requests | Sem duplicação, sem aceitar em nome do capitão |
| PUT /users/team | Convidado aceita convite | PUT /users/me/team-invitations/:requestId | Apenas destinatário, convite pendente, capitão ainda autorizado |
| POST /users | Login Google, perfil e preferências; assumia 18 anos se ausente | Supabase Auth + GET/PATCH /users/me | Não fabricar data de nascimento; perfil provisionado externamente, declarar idade antes de participar |
| POST /users/admin | Mesmo login, sem promoção explícita no controller | Supabase Auth + permissão persistida | Nunca permitir que cliente escolha papel administrativo |
| POST /users/appointments | Entrar como titular/reserva e receber chat | POST /users/me/appointments/:appointmentId | Capacidade, duplicação, horário e estado sob lock; titular/reserva preservados |
| GET /sports/prefered-sports | Favoritos do usuário | GET /users/me/sports | Lista + limite/slots; identidade do token |
| POST /sports/prefered-sports | Adicionar favoritos; conferia quantidade antes do lote | PUT /users/me/sports | Substituição idempotente e transacional, no máximo quatro distintos no resultado final |
| PUT /sports/prefered-sports | Substituir todos favoritos atomicamente | PUT /users/me/sports | Mesma regra de quatro e existência de todas as modalidades |
| PUT /users/theme | Persistir tema; usuário escolhido por email | PUT /users/me/theme | Tema enumerado, preferência do usuário autenticado |

## Capacidades acrescentadas em B

Ligas/torneios não possuem rotas em A. Não remover essas funcionalidades nem inventar uma intenção Laravel: manter cadastro/edição, inscrições, convites, arenas/horários, calendário, avanço de rodada, resultados, classificação, reagendamento, cancelamento e encerramento. Extrair as decisões de negócio hoje misturadas no repositório de 1.797 linhas. Manter testes das restrições de chave, ordem de locks e transições de estado.

## Validação e arquitetura verificáveis

- Um schema Zod representa o contrato de transporte; formulários adaptam strings/controles antes de produzir esse contrato. Domínio não importa Nest, ORM ou schemas HTTP.
- Rejeitar campos desconhecidos em entradas; projetar explicitamente saídas, sem expor propriedades extras.
- Comparar OpenAPI e respostas com os testes HTTP existentes, incluindo null/undefined/defaults e status de erro.
- Casos de uso devem ser testáveis com portas em memória. Testes de integração verificam locks, rollback, constraints e consultas contra PostgreSQL descartável.
- Registrar desvios e etapas pendentes; não afirmar equivalência de comportamento só porque o endpoint tem o mesmo nome.
