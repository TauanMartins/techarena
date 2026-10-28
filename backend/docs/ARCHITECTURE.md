# Arquitetura

Os contextos ficam em `src/modules/`. O núcleo de usuários depende de tipos próprios
e portas. NestJS, TypeORM, HTTP e Supabase aparecem nos adaptadores e na composição.

```text
users/
  domain/              modelos, regras e contrato UserRepository
  application/         casos de uso UserApplication
  adapters/http/       controllers, DTOs e mapeamento de erros HTTP
  adapters/persistence/ implementação TypeORM da porta
  users.module.ts      composição de dependências

auth/
  domain/              identidade verificada e porta AccessTokenVerifier
  adapters/http/       Bearer guard, CurrentUser e Public
  adapters/supabase/   implementação criptográfica por JWKS
  auth.module.ts       composição e registro do guard global
```

O fluxo é controller -> caso de uso -> porta -> adaptador. O núcleo não importa
NestJS, TypeORM, class-validator nem Supabase. DTOs HTTP são convertidos em dados
da aplicação; modelos de persistência nunca são retornados diretamente.

Regras de idade, limites de favoritos e elegibilidade de agendamento ficam no núcleo.
O adaptador de persistência abre transações, bloqueia a linha do usuário para trocar
favoritos e bloqueia o agendamento antes de consultar sua lotação e aplicar a política
de admissão. Todo futuro caminho de inscrição deve respeitar o mesmo bloqueio.
Constraints e conflitos de unicidade continuam protegendo o estado no PostgreSQL.

O contexto Auth expõe somente identidade verificada. Não cria perfil implicitamente
em cada requisição. O caso de uso de inicialização de perfil é idempotente e preserva
perfis existentes, inclusive aqueles provisionados por uma integração externa.
Permissões de negócio são lidas do banco; claims de metadata não elevam privilégios.

`src/config/` centraliza ambiente e fornece configuração por injeção ao Nest. A CLI
usa o mesmo carregador. `src/bootstrap/configure-http.ts` configura validação, CORS e
Swagger e é compartilhado com testes HTTP. `src/common/http/` contém somente
mecanismos transversais de contratos de resposta e IDs de transporte.

`src/database/entities/` é o mapeamento da persistência existente. Os adaptadores
escolhem as entities usadas por seus contextos. A composição global do TypeORM não
habilita sincronização nem executa migrations durante o bootstrap da API.
