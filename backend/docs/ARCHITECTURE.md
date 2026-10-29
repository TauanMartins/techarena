# Arquitetura

Os contextos ficam em `src/modules/`. O núcleo depende de tipos e portas próprios;
NestJS, TypeORM e HTTP aparecem nos adaptadores e na composição.

```text
users/
  users.module.ts                   composição do contexto, sem regras ou repositories
  profile/                          perfil privado e regra de idade
  directory/                        busca de cards públicos
  preferences/
    preferences.module.ts           composição das preferências
    theme/                          tema do usuário
    favorite-sports/                limite e substituição de favoritos
  memberships/
    memberships.module.ts           composição dos vínculos
    teams/                          consulta de vínculos efetivos de equipes
    appointments/                   consulta e admissão em agendamentos
  shared/
    domain/                         erro do contexto e paginação
    http/                           DTOs comuns e convenções dos controllers
    persistence/                    tradução de erros PostgreSQL
```

Cada subcontexto folha tem `domain/`, `application/`, `adapters/http/`,
`adapters/persistence/` e um módulo próprio. Cada um declara uma porta de repository
restrita às suas operações. Não há repository ou serviço único reunindo todas as
funcionalidades de usuários. Os módulos agregadores apenas importam os módulos filhos.

Repositories ficam encapsulados no módulo que os utiliza. `ProfileModule` exporta
somente `PROFILE_ACCESS`, uma porta de aplicação com `ensureExists` e `ensureAdult`.
Preferências e vínculos dependem dessa porta para verificar elegibilidade; não podem
editar perfis nem importar implementações de persistência de outro subcontexto.
O serviço de perfil é privado ao módulo, assim como os demais serviços de aplicação.
A verificação de existência usa uma consulta de existência, e a de maioridade lê
somente o nascimento, sem carregar os campos privados e o relacionamento de permissão.

O fluxo é controller -> caso de uso -> porta -> adaptador. DTOs de entrada e saída
ficam ao lado do controller correspondente; somente card público e paginação são
compartilhados. Entities nunca são retornadas diretamente. O decorator `UserEndpoint`
reúne as convenções de autenticação, erros e tags de Swagger sem mover regras de
negócio para uma classe base ou criar controllers com herança.

Regras de idade, limites de favoritos e admissão em agendamentos ficam nos respectivos
domínios/casos de uso. O adaptador de favoritos bloqueia a linha do usuário durante a
troca. O adaptador de agendamentos bloqueia o agendamento antes de consultar lotação
e aplicar a política de admissão. O relógio é avaliado somente após obter o bloqueio,
para não usar um horário anterior ao tempo de espera da transação. Futuras inscrições
devem respeitar o mesmo bloqueio.
As constraints PostgreSQL continuam garantindo integridade e unicidade.

O contexto `auth/` define a identidade verificada e a porta `AccessTokenVerifier`.
Seu adaptador Supabase usa JWKS e o adaptador HTTP implementa o guard global.
A criação de perfil pertence ao trigger externo em `auth.users`, que insere em
`public.users`. A API trabalha apenas com perfis existentes, sem provisionamento.
Permissões de negócio vêm do banco, nunca de metadata editável no token.

`src/config/` centraliza ambiente e configuração tipada. A CLI usa o mesmo carregador.
`src/bootstrap/configure-http.ts` configura validação, CORS e Swagger e é compartilhado
com os testes HTTP. `src/database/entities/` representa o esquema existente; migrations
continuam explícitas e não são executadas ao iniciar a API.

O teste de arquitetura impede imports de frameworks e adaptadores nos diretórios de
domínio/aplicação. Os testes HTTP com PostgreSQL verificam a composição real dos módulos,
a autorização, os contratos e a concorrência.

Os filtros de listagem têm tipos e DTOs próprios em cada subcontexto. O domínio
valida limites, enumerações e intervalo de datas; os repositories vinculam parâmetros
e usam uma lista fixa de colunas para ordenação. A paginação compartilhada calcula
os metadados de navegação, enquanto a composição de cards continua no adaptador
correspondente. Não existe um query DTO genérico que aceite filtros de todos os módulos.

## Contextos migrados de catálogo e participação

- `sports/`: catálogo de modalidades, modalidades de arena e materiais.
- `arenas/`: aplicações de catálogo e gestão, com escrita administrativa.
- `appointments/`: descoberta, reserva transacional e disponibilidade de horários.
- `teams/`: catálogo, gestão por capitão e ciclo de pedidos/convites.
- `friends/`: solicitações, aceite e bloqueio de relações.

Cada contexto define sua própria porta de persistência e separa aplicação/domínio dos
adaptadores. As operações que precisam de verificação e escrita atômicas, como reserva
ou aceite, ficam dentro da transação do adaptador e aplicam as políticas do domínio.
Não há dependência de AWS ou criação de chat nessas operações.

## Chat persistente via Supabase

O histórico e a presença do chat são lidos e escritos diretamente pelo frontend no
Supabase. `chat_messages` é protegido por RLS; as conversas são privadas e o
Realtime só autoriza participantes registrados em `chat_participants`.
`POST /chat/access` valida a identidade contra a amizade, equipe ou agendamento
no PostgreSQL da API e provisiona somente o próprio usuário no Supabase. O backend
usa `SUPABASE_SERVICE_ROLE_KEY` exclusivamente para essa operação; a chave nunca é
enviada ao frontend. O SQL de configuração e policies está em
`database/sql/supabase-chat.sql` e precisa ser aplicado ao projeto Supabase.

Paginação, geolocalização, IDs, erros de domínio e convenções HTTP compartilháveis
ficam em `common/`; usuários mantém reexports para não quebrar seus subcontextos.
`ProfileModule` também expõe `ensureAdmin`, que verifica a permissão persistida.
Novos módulos não importam repositories de usuários para autenticar ou conceder roles.
O teste de arquitetura abrange todos os módulos, e não apenas usuários.

As datas de reserva usam `timestamptz` e slots UTC explícitos. Os vínculos com a arena,
modalidade e schedule são opcionais apenas para compatibilidade com dados anteriores.
A integridade dos novos vínculos e a exclusividade de arena/instante são constraints
PostgreSQL versionadas, além da validação dos casos de uso.

Referências: [módulos NestJS](https://docs.nestjs.com/modules),
[DTOs e OpenAPI](https://docs.nestjs.com/openapi/types-and-parameters) e
[migrations TypeORM](https://typeorm.io/docs/advanced-topics/migrations/).
