# Frontend TechArena

Aplicacao web em React e TypeScript, com roteamento por modulo, React-Bootstrap e Vite. A estrutura foi reimplementada a partir dos fluxos do app React Native arquivado em `../frontend.old`, usando os contratos atuais do NestJS como fonte da verdade.

## Executar com Docker Compose

Na raiz do repositório, copie os dois templates para os arquivos que o Compose carrega:

```bash
cp .env.frontend.example .env.frontend
cp .env.backend.example .env.backend
```

Configure os valores públicos do frontend em `.env.frontend` e as credenciais do servidor em `.env.backend`. A service role key é secreta e exclusiva do backend; nunca a coloque em `.env.frontend` ou em uma variável `VITE_*`.

```bash
docker compose up --build
```

A aplicacao fica disponivel em <http://localhost:4200>, a API em <http://localhost:3000> (Swagger em <http://localhost:3000/api>) e o PostgreSQL local na porta `5432`. `VITE_API_BASE_URL` aponta para a raiz da API visivel pelo navegador.

## Executar localmente

```bash
npm ci
npm run dev
```

Para executar diretamente no host, copie `frontend/.env.example` para `frontend/.env.local` e configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_API_BASE_URL`. Configure Google como provedor em **Supabase > Authentication > Providers** e permita a URL local como redirect URL. Apenas a URL do projeto e a publishable key podem estar no frontend; `SUPABASE_SERVICE_ROLE_KEY` (chave secret `sb_secret_...` ou chave legada `service_role`) é exclusiva do backend e nunca deve ser exposta ao navegador.

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

## Arquitetura e formularios

As paginas do roteador sao carregadas sob demanda com `lazy` e `Suspense`, mantendo o bundle inicial menor. Acesso ao contexto de autenticacao fica no hook `useAuth`, separado do provider; ele usa a API `use` do React 19 para ler o contexto.

O codigo e organizado por responsabilidade: `pages/` compoe telas e fluxos de rota; `features/` agrupa comportamento e componentes especificos de uma funcionalidade (por exemplo, conversas e ligas); `components/` contem pecas compartilhadas entre funcionalidades; `shared/` concentra contratos, transporte HTTP, validacao e configuracao comum; `auth/` e `features/preferences/` mantem seus providers e hooks de contexto. Evite mover componentes de dominio para `components/` apenas para reduzir o tamanho de uma pagina.

Formularios com varios campos usam React Hook Form e schemas Zod compartilhados em `src/shared/validation.ts`. Os schemas normalizam valores e validam limites antes de chamar a API. Entradas simples e interativas, como composicao de mensagens e filtros, permanecem controladas localmente quando nao se beneficiam do estado e ciclo de validacao de um formulario completo.

Dados remotos usam TanStack Query sobre a camada `fetch` central em `src/shared/api.ts`. Chaves incluem a identidade do usuario, e mutacoes invalidam os dados relacionados para manter as telas sincronizadas; o access token nunca faz parte das chaves de cache. O Supabase Realtime continua responsavel pelos eventos ao vivo do chat.

Componentes de tela extensos devem ser divididos por fluxo de usuario e nao apenas em fragmentos visuais: componentes de dominio ficam no modulo correspondente, hooks de consulta/mutacao concentram acesso a dados e a pagina orquestra o estado entre secoes. A interface de partidas e o modal de detalhes da equipe estao em `features/leagues/` e `features/teams/`; consultas e componentes especificos tambem ficam nesses modulos. No chat, a composicao de conversas, o mapeamento de mensagens, as operacoes de persistencia e a coordenacao do ciclo de vida Realtime estao separados em `features/chat/`. `LeaguePage.tsx` e `TeamsPage.tsx` ainda coordenam varios fluxos e devem continuar sendo decompostas incrementalmente, escolhendo limites que simplifiquem cada fluxo sem criar camadas apenas por padrao. Mantenha cada extracao coberta pelos testes da funcionalidade e sem alterar os contratos visiveis.

## Funcionalidades e integracoes

- Login Google pelo Supabase Auth; a sessao renovavel fornece o access token enviado como `Authorization: Bearer <accessToken>` em todas as rotas protegidas do NestJS.
- Perfil, preferencias de tema e esportes favoritos usam `/users/me`, `/users/me/theme` e `/users/me/sports`.
- Agendamentos, horarios, arenas, equipes, amizades e busca de atletas consomem os endpoints atuais descritos no Swagger do backend.
- Ligas permitem configurar pontos corridos, mata-mata ou grupos seguidos de mata-mata; inscrever equipes, enviar convites para capitães, aceitar/recusar convites, gerar calendarios em arenas que atendam a modalidade, lancar e corrigir resultados, avancar fases, reagendar partidas e encerrar competicoes. O acesso de gerenciamento e restrito ao organizador, e o backend valida a integridade da tabela e do calendario.
- Chat direto, de equipe e de agendamento carrega mensagens persistentes de `chat_messages` e recebe novas mensagens via Supabase Realtime. A tela carrega o historico recente e permite paginar para mensagens anteriores; mensagens do sistema legado nao sao importadas automaticamente. Presenca mostra quem esta conectado ao canal da conversa no momento; nao representa um status global do usuario. RLS limita leitura/envio aos participantes provisionados pelo backend, e bloquear uma amizade revoga os dois participantes da conversa direta.

## Testes

Os testes cobrem a inclusao do access token e a propagacao de erros da API, a validacao de topicos de conversa e a conversao/ordenacao de mensagens persistidas.
