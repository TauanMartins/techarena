# Frontend TechArena

Aplicacao web em React e TypeScript, com roteamento por modulo, React-Bootstrap e Vite. A estrutura foi reimplementada a partir dos fluxos do app React Native arquivado em `../frontend.old`, usando os contratos atuais do NestJS como fonte da verdade.

## Executar com Docker Compose

Configure o arquivo `.env` na raiz com `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`, depois execute:

```bash
docker compose up --build
```

A aplicacao fica disponivel em <http://localhost:4200>, a API em <http://localhost:3000> (Swagger em <http://localhost:3000/api>) e o PostgreSQL local na porta `5432`. `VITE_API_BASE_URL` aponta para a raiz da API visivel pelo navegador.

## Executar localmente

```bash
npm ci
npm run dev
```

Para executar diretamente no host, crie `frontend/.env.local` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_API_BASE_URL=http://localhost:3000`. Configure Google como provedor em **Supabase > Authentication > Providers** e permita a URL local como redirect URL. Apenas a URL do projeto e a publishable key podem estar no frontend; `SUPABASE_SERVICE_ROLE_KEY` (chave secret `sb_secret_...` ou chave legada `service_role`) e exclusiva do backend e nunca deve ser exposta ao navegador.

O esquema do chat no Supabase e versionado em [`../supabase/migrations/`](../supabase/migrations/). Para aplicar migrations pendentes, instale a [Supabase CLI](https://supabase.com/docs/guides/cli), vincule o projeto uma vez e execute a partir da raiz do repositorio:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

O CLI solicita a senha do banco durante o vínculo. Nao a grave no repositorio. `npm run db:migrate` continua sendo o comando TypeORM para o PostgreSQL usado pela API, definido por `DATABASE_URL`; ele nao aplica migrations no Supabase. Mantenha os dois fluxos separados: migrations TypeORM em `backend/src/database/migrations/` e migrations Supabase em `supabase/migrations/`. O backend valida a participacao atual no PostgreSQL da API e provisiona somente o participante autenticado nas tabelas do Supabase.

Para validar o projeto:

```bash
npm run build
npm run lint
npm test
```

## Funcionalidades e integracoes

- Login Google pelo Supabase Auth; a sessao renovavel fornece o access token enviado como `Authorization: Bearer <accessToken>` em todas as rotas protegidas do NestJS.
- Perfil, preferencias de tema e esportes favoritos usam `/users/me`, `/users/me/theme` e `/users/me/sports`.
- Agendamentos, horarios, arenas, equipes, amizades e busca de atletas consomem os endpoints atuais descritos no Swagger do backend.
- Ligas permitem configurar pontos corridos, mata-mata ou grupos seguidos de mata-mata; inscrever equipes, gerar calendarios, lancar e corrigir resultados, avancar fases, reagendar partidas e encerrar competicoes. O acesso de gerenciamento e restrito ao organizador, e o backend valida a integridade da tabela e do calendario.
- Chat direto, de equipe e de agendamento carrega mensagens persistentes de `chat_messages` e recebe novas mensagens via Supabase Realtime. A tela carrega o historico recente e permite paginar para mensagens anteriores; mensagens do sistema legado nao sao importadas automaticamente. Presenca mostra quem esta conectado ao canal da conversa no momento; nao representa um status global do usuario. RLS limita leitura/envio aos participantes provisionados pelo backend, e bloquear uma amizade revoga os dois participantes da conversa direta.

## Testes

Os testes cobrem a inclusao do access token e a propagacao de erros da API, a validacao de topicos de conversa e a conversao/ordenacao de mensagens persistidas.
