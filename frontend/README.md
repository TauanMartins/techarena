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

## Identidade visual

O tema é centralizado em [`src/styles/theme.scss`](src/styles/theme.scss), importado uma única vez por `main.tsx`. Esse arquivo configura as variáveis Sass antes de compilar o Bootstrap; não importe também o CSS pronto de `bootstrap/dist/css`.

- **Paleta:** altere `$primary` para a cor da marca. `$secondary` e a escala `$gray-*` definem os neutros; `$success`, `$info`, `$warning` e `$danger` representam estados semânticos.
- **Claro e escuro:** os grupos `$body-*` e `$body-*-dark` definem superfícies e textos. O `ThemeProvider` continua controlando `data-bs-theme`. As variantes outline no escuro usam o mixin do Bootstrap com as cores de ênfase derivadas da paleta.
- **Fontes:** `$font-family-sans-serif` controla textos e formulários; `$headings-font-family` e `$display-font-family` controlam os títulos. Sansation Regular é servida localmente, com `font-display: swap`; os textos usam a fonte do sistema. Para adicionar outros pesos reais, registre os respectivos arquivos em `@font-face`.

Nos componentes, continue usando variantes semânticas (`variant="primary"`) e classes do Bootstrap (`bg-body`, `text-body-secondary`, `text-primary-emphasis`). Evite cores literais, estilos inline e classes específicas de tela. Após alterar a paleta, valide contraste e estados de hover, foco e seleção nos dois temas; a compilação deriva as variantes, mas não substitui essa revisão.

## Arquitetura e formularios

As paginas do roteador sao carregadas sob demanda com `lazy` e `Suspense`, mantendo o bundle inicial menor. Acesso ao contexto de autenticacao fica no hook `useAuth`, separado do provider; ele usa a API `use` do React 19 para ler o contexto.

O codigo e organizado por responsabilidade: `pages/` compoe telas e fluxos de rota; `features/` agrupa, por dominio, APIs com TanStack Query, componentes, hooks, schemas Zod e tipos; `components/ui` concentra pecas visuais compartilhadas; `lib/` inicializa os clientes HTTP, Supabase e TanStack Query; `auth/` e `features/preferences/` mantem seus providers e hooks de contexto. Os arquivos em `shared/` preservam exports de compatibilidade e contratos comuns.

Formularios com varios campos usam React Hook Form e schemas Zod co-localizados em `src/features/[feature]/schemas/`. Os schemas normalizam valores e validam limites antes de chamar a API. Entradas simples e interativas, como composicao de mensagens e filtros, permanecem controladas localmente quando nao se beneficiam do estado e ciclo de validacao de um formulario completo.

Dados remotos usam hooks de feature com TanStack Query sobre o transporte `fetch` em `src/lib/api-client.ts`. Chaves incluem a identidade do usuario, e mutacoes invalidam os dados relacionados para manter as telas sincronizadas; o access token nunca faz parte das chaves de cache. O ciclo de vida do Supabase Realtime fica isolado nos hooks de chat.

Componentes de tela extensos devem ser divididos por fluxo de usuario e nao apenas em fragmentos visuais: componentes de dominio ficam no modulo correspondente, hooks de consulta/mutacao concentram acesso a dados e a pagina orquestra os componentes da feature. A interface de ligas, equipes, agendamentos, comunidade, configuracoes e chat esta organizada em modulos por dominio. Preserve os contratos visiveis e regras de negocio ao extrair novos fluxos.

## Funcionalidades e integracoes

- Login Google pelo Supabase Auth; a sessao renovavel fornece o access token enviado como `Authorization: Bearer <accessToken>` em todas as rotas protegidas do NestJS.
- Perfil, preferencias de tema e esportes favoritos usam `/users/me`, `/users/me/theme` e `/users/me/sports`.
- Agendamentos, horarios, arenas, equipes, amizades e busca de atletas consomem os endpoints atuais descritos no Swagger do backend.
- Ligas permitem configurar pontos corridos, mata-mata ou grupos seguidos de mata-mata; inscrever equipes, enviar convites para capitães, aceitar/recusar convites, gerar calendarios em arenas que atendam a modalidade, lancar e corrigir resultados, avancar fases, reagendar partidas e encerrar competicoes. O acesso de gerenciamento e restrito ao organizador, e o backend valida a integridade da tabela e do calendario.
- Chat direto, de equipe e de agendamento carrega mensagens persistentes de `chat_messages` e recebe novas mensagens via Supabase Realtime. A tela carrega o historico recente e permite paginar para mensagens anteriores; mensagens do sistema legado nao sao importadas automaticamente. Presenca mostra quem esta conectado ao canal da conversa no momento; nao representa um status global do usuario. RLS limita leitura/envio aos participantes provisionados pelo backend, e bloquear uma amizade revoga os dois participantes da conversa direta.

## Testes

Os testes cobrem a inclusao do access token e a propagacao de erros da API, a validacao de topicos de conversa e a conversao/ordenacao de mensagens persistidas.

## Base visual e temas

O núcleo visual usa Bootstrap 5.3 e React-Bootstrap, com Bootstrap Icons para ícones.
O `ThemeProvider` aplica a preferência existente (`light`, `dark` ou `system`) em
`data-bs-theme` no elemento `html`; cores e estados dos componentes vêm do Bootstrap.

- Superfície principal: `bg-body`; fundo da aplicação: `bg-body-tertiary`.
- Texto: `text-body` e `text-body-secondary`; destaque: `text-primary-emphasis`.
- Ações principais: `primary`; feedback: variantes nativas `success`, `warning` e `danger`.
- Layout: `Container`, `Row`, `Col` e utilitários responsivos; cartões: `border`, `rounded-4`, `shadow-sm`.
- Não adicionar estilos inline, CSS Modules ou sobrescritas globais dos componentes Bootstrap.

O frontend não importa CSS próprio: apenas Bootstrap e Bootstrap Icons em `main.tsx`.
Não criar `index.css`, classes específicas de componentes ou folhas de estilo alternativas.
Use `Container` para limitar a largura, `Row`/`Col` para grades responsivas e `Stack`
ou utilitários flex para alinhamentos simples. Classes Bootstrap em elementos semânticos
(`main`, `section`, `header`) são igualmente válidas e evitam contêineres desnecessários.

O login possui uma composição própria com cartão de acesso e apresentação da comunidade.
As demais funcionalidades tiveram suas dependências de CSS substituídas por utilitários
nativos; seu refinamento visual por área permanece para as próximas etapas.

Avatares usam o componente compartilhado `Avatar`: 40 px em listas/cabeçalhos e
80 px em detalhes, sempre com proporção quadrada, recorte circular e borda nativa
de 1 px. Sem foto, os símbolos Bootstrap Icons acompanham o tema. Não adicionar
padding ou classes de tamanho nos consumidores. `SportIcon` apresenta um pequeno
marcador de cor semântica, acompanhado do nome da modalidade, sem fundos próprios.

Padrões compartilhados: `NavigationLink` mantém o espaçamento e o estado ativo dos
links; `IconButton` padroniza ações somente com ícone e seu nome acessível;
`SectionHeading` reúne título, contexto e ação de seção; `PersonListItem` organiza
avatar, identificação e ações sem incorporar regras de amizades ou equipes.
A navegação lateral usa `Nav` com `navbar={false}` dentro de `Navbar.Collapse`: isso
preserva o estilo `pills` sem herdar as cores e o padding próprios de uma navbar.
Grades existentes com `row`/`col-*` são válidas; prefira `Row`/`Col` quando suas
props tornarem a estrutura mais clara. Use `Stack` ou flex para alinhamentos
unidimensionais, sem adicionar grades apenas para reduzir a lista de classes.

## Formatação do código

A formatação é definida em `.prettierrc.json` e aplicada pelo Prettier, também
integrado ao ESLint pelo preset `eslint-plugin-prettier/recommended`. O Oxlint
continua responsável pelas regras de qualidade e hooks. Não adicionar regras
de estilo concorrentes ao ESLint.

O padrão usa dois espaços, aspas simples no TypeScript, aspas duplas no JSX,
ponto e vírgula, vírgulas finais e atributos JSX separados por linha. A largura
alvo é de 80 caracteres; strings e classes longas podem ultrapassá-la para não
alterar seu conteúdo. Elementos e expressões são distribuídos conforme a árvore
do código, sem modificar lógica, callbacks ou a ordem das propriedades.

Execute dentro de `frontend`:

```bash
npm run format        # Formata fontes, testes, configurações e documentação
npm run format:check  # Verifica a formatação sem modificar arquivos
npm run lint          # Executa Oxlint e ESLint, incluindo erros de formatação
npm run lint:fix      # Corrige a formatação de JS, TS e JSX pelo ESLint
```

`node_modules`, builds, cobertura, imagens, arquivos públicos e o lockfile são
ignorados pelo formatador. O `.editorconfig` padroniza indentação e finais de
linha; editores com integração Prettier podem usar a configuração local para
formatar ao salvar. As versões das ferramentas de formatação estão fixadas no
`package.json` e no lockfile para manter resultados consistentes entre máquinas.

O parser Babel é usado somente pelo ESLint para ler TS/TSX. Isso evita a
incompatibilidade atual do `@typescript-eslint/parser` com o TypeScript 7
instalado, sem trocar o compilador do projeto. A verificação de tipos continua
no `tsc` durante o build.
