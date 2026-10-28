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

O fluxo é controller -> caso de uso -> porta -> adaptador. DTOs de entrada e saída
ficam ao lado do controller correspondente; somente card público e paginação são
compartilhados. Entities nunca são retornadas diretamente. O decorator `UserEndpoint`
reúne as convenções de autenticação, erros e tags de Swagger sem mover regras de
negócio para uma classe base ou criar controllers com herança.

Regras de idade, limites de favoritos e admissão em agendamentos ficam nos respectivos
domínios/casos de uso. O adaptador de favoritos bloqueia a linha do usuário durante a
troca. O adaptador de agendamentos bloqueia o agendamento antes de consultar lotação
e aplicar a política de admissão. Futuras inscrições devem respeitar o mesmo bloqueio.
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
