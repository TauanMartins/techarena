# Banco de dados

O TypeORM gerencia o esquema PostgreSQL da aplicação. As entities em
`src/database/entities/` descrevem a persistência; migrations em
`src/database/migrations/` registram sua evolução. `synchronize` e `migrationsRun`
permanecem desativados: iniciar a API não modifica o esquema.

## Preparar o ambiente local

Na raiz do projeto:

```sh
docker compose up -d
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:check
docker compose exec backend npm run db:seed
```

Para executar os comandos fora do Docker, entre em `backend/`, copie
`.env.example` para `.env`, instale as dependências com `npm ci` e use os mesmos
scripts npm. A URL com `localhost` é para o host; no container o Compose fornece
uma URL com o hostname `postgres` quando não existe override.
Se o `.env` da raiz define `DATABASE_URL` apontando ao Supabase, o backend e os
comandos executados por `docker compose exec backend` usam **esse banco remoto**.
Migrar `localhost:5432/techarena` no host não migra o Supabase. Confira o destino
antes de executar comandos de escrita; não publique a URL com credenciais.

## Verificar o esquema antes de servir a API

A API verifica migrations pendentes e resolve todas as colunas mapeadas pelas
entities durante a inicialização, com consultas `SELECT ... LIMIT 0`, sem ler linhas
ou alterar o esquema. Se houver migration pendente ou coluna/tabela ausente, a API
recusa iniciar com mensagem de diagnóstico. A aplicação nunca aplica migrations
automaticamente. Execute o comando acima no banco efetivamente usado pela API e,
se o watcher já parou a inicialização, reinicie com `docker compose restart backend`.

`npm run db:check` executa a mesma verificação de leitura usando a configuração da
CLI. `npm run db:check:prod` usa o código compilado. `/health` também responde 503
se o banco estiver indisponível ou se uma migration ficar pendente após o início.
A verificação de colunas não substitui a revisão de migrations: tipos, índices e
constraints podem ser comparados com `npm run typeorm -- schema:log -d src/database/data-source.ts`.
Esse comando somente descreve diferenças; não use `schema:sync` para corrigir produção.

## Fluxo de evolução

1. Modifique as entities e documente os campos cujo significado não seja evidente.
   Exporte novas entities em `src/database/entities/index.ts` para registrá-las.
2. Gere uma migration: `npm run db:migration:generate -- src/database/migrations/DescribeChange`.
3. Revise o SQL gerado, especialmente renomes, remoções, defaults e dados existentes.
4. Execute `npm run db:migrate` e confira `npm run db:status`.
5. Versione entities, migrations e documentação juntas. Não edite migrations aplicadas.

`npm run db:migration:create -- src/database/migrations/DescribeChange` cria uma
migration vazia para SQL explícito, como extensões, índices de expressão ou mudanças
em dados. `npm run db:rollback` executa o `down` da última migration; o rollback da
migration inicial remove as tabelas e seus dados e deve ser usado apenas em bancos
descartáveis.

A migration inicial mantém um snapshot SQL revisado do esquema Laravel final e seus
comentários em `database/sql/`. O SQL é executado pelo TypeORM em transação, e o
histórico fica em `public.typeorm_migrations`. Uma segunda migration normaliza dois
defaults `CURRENT_TIMESTAMP` para o equivalente `now()`, usado pelo TypeORM.

## Dados iniciais

`npm run db:seed` usa repositories TypeORM e upserts em uma transação para carregar
os dados de referência traduzidos dos seeders Laravel: permissões, preferência,
36 horários, esportes, materiais, arenas e seus vínculos. Pode ser reexecutado;
registros de referência com os mesmos identificadores são atualizados. As imagens
que apontavam para AWS permanecem nulas até a migração dos arquivos.

## Configuração

`src/config/environment.ts` é o único ponto de leitura das variáveis de ambiente.
Ele carrega `.env`, valida `PORT` e `DATABASE_URL` e produz uma configuração tipada.
O Nest recebe essa configuração por injeção de dependência; a CLI TypeORM e o seed
usam o mesmo carregador. Novas variáveis devem ser declaradas e validadas nesse ponto,
sem acessar `process.env` nos serviços ou módulos consumidores.

O PostgreSQL local usa PostGIS porque `appointment.location` é uma coluna geometry.
As migrations gerenciam somente as tabelas da aplicação e seus comentários.
A migration de documentação local atualiza os comentários de perfil sem alterar dados;
os SQLs de migrations anteriores são mantidos como histórico imutável.

O esquema do chat é mantido pelo Supabase CLI em `../supabase/migrations/`, separado
das migrations TypeORM. Aplique-o ao projeto Supabase com `supabase db push`; não
execute SQL dependente de `auth` e `realtime` no PostgreSQL local da API.

Após compilar com `npm run build`, ambientes que instalam apenas dependências de
produção podem usar `npm run db:migrate:prod` e `npm run db:seed:prod`. Distribua
`dist/` e `database/sql/` junto com a aplicação.

## Banco já criado pelo executor antigo

Um banco vazio recebe todas as migrations normalmente. Um banco preenchido pelo
executor anterior precisa de uma adoção inicial, uma única vez: conferir o histórico
`private.schema_migrations`, comparar o esquema com as entities e registrar somente
`InitialSchema1793145600000` como já aplicada pelo mecanismo `fake` do TypeORM.
Depois, execute as migrations pendentes normalmente. Não use `migration:run --fake`
indiscriminadamente, pois isso registraria todas as migrations pendentes sem executá-las.
O histórico anterior pode permanecer para auditoria. A adoção do banco local desta
refatoração foi feita preservando os dados.

Veja [o dicionário e o diagrama](SCHEMA.md) para a estrutura inicial.
