# TechArena backend

API NestJS com PostgreSQL/PostGIS e TypeORM. O código Laravel anterior está em
`../backend.old/` para referência de migração.

## Ambiente local

Na raiz do repositório:

```sh
cp .env.example .env
# Edite .env para configurar SUPABASE_URL e CORS_ORIGINS.
docker compose up -d
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Configure `SUPABASE_URL` e `CORS_ORIGINS` no `.env` da raiz antes de subir o Compose.
A URL é obtida no diálogo **Connect** do projeto Supabase. O backend valida tokens
com as chaves públicas JWKS e não precisa da publishable key; o SDK do frontend
precisa dela. Veja [onde obter os valores e como a validação funciona](docs/AUTHENTICATION.md).
Sem configuração Auth, a API inicia e `/health` permanece público; usuários exigem
um Bearer token válido e o provedor configurado. Não existe login local alternativo.
A autenticação remota não implica trocar o PostgreSQL local ou instalar Supabase local.

No host, use as versões de Node/npm indicadas em `package.json`, `npm ci`, copie
`.env.example` para `.env` e execute `npm run start:dev`. A configuração das variáveis
fica exclusivamente em `src/config/environment.ts`.

- Saúde com consulta ao banco: `GET /health` (200 ou 503).
- Swagger UI: `/api`; OpenAPI JSON: `/api-json`.
- A rota `/` do scaffold foi removida.

## Módulos

Usuários estão organizados em perfil, busca, preferências (tema/favoritos) e vínculos
(equipes/agendamentos), cada um com suas portas, casos de uso e adaptadores.

Veja [autenticação](docs/AUTHENTICATION.md), [rotas e decisões do contexto user](docs/USERS.md),
[arquitetura](docs/ARCHITECTURE.md), [contratos HTTP](docs/API-CONVENTIONS.md) e
[migrations/seeds](database/README.md).

## Testes

`npm test` executa testes unitários do domínio, casos de uso, configuração,
contratos e autenticação criptográfica, sem acessar serviços externos.

Para o conjunto de integração, crie um PostgreSQL exclusivo cujo nome termine em
`_test`. Não use o banco de desenvolvimento: os testes de usuários truncam dados.

```sh
# Na raiz, criar uma vez; depois executar em backend/.
docker compose exec postgres createdb -U postgres techarena_users_test

# Exportar em backend/ para todos os comandos abaixo.
export DATABASE_URL=postgresql://postgres:secret@localhost:5432/techarena_users_test
npm run db:migrate
npm run db:seed
npm run test:e2e
```

A suíte de usuários falha antes de acessar o banco quando o destino não termina em
`_test`; isso evita executar operações destrutivas no ambiente de desenvolvimento. Os testes de usuários usam JWTs ES256 reais
com chaves locais de teste e o mesmo pipeline HTTP da aplicação. Cobrem concorrência,
transações, propriedade dos registros, Bearer, CORS, Swagger e validação de DTOs.
Os adaptadores de teste nunca são registrados no módulo de produção.

`npm run build` compila o projeto com o plugin Swagger. Para compilar no container:
`docker compose exec backend npm run build`.
