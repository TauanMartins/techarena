# Frontend TechArena

Aplicacao web em React e TypeScript, com roteamento por modulo, React-Bootstrap e Vite. A estrutura foi reimplementada a partir dos fluxos do app React Native arquivado em `../frontend.old`, usando os contratos atuais do NestJS como fonte da verdade.

## Executar com Docker Compose

Configure o arquivo `.env` na raiz com `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `DATABASE_URL`, depois execute:

```bash
docker compose up --build
```

A aplicacao fica disponivel em <http://localhost:4200>, a API em <http://localhost:3000/api> e o PostgreSQL local na porta `5432`. `VITE_API_BASE_URL` pode ser ajustada para o endereco da API visivel pelo navegador.

## Executar localmente

```bash
npm ci
npm run dev
```

Para executar diretamente no host, crie `frontend/.env.local` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_API_BASE_URL`. Configure Google como provedor em **Supabase > Authentication > Providers** e permita a URL local como redirect URL. Apenas a URL do projeto e a publishable key podem estar no frontend; nao exponha service role keys.

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
- A tela de ligas segue o fluxo legado de criacao de eventos usando os endpoints atuais de esporte, arena, disponibilidade e agendamento. O backend atual nao expoe endpoints de CRUD para `league` ou `league_team`, portanto a interface nao inventa nem persiste dados dessas entidades.
- Chat direto, de equipe e de agendamento usa canais privados Broadcast do Supabase Realtime com os topicos previstos pelas policies da migracao. O banco atual nao persiste mensagens: o historico e efemero durante a conexao. Confirme no projeto Supabase que o acesso publico do Realtime esta desligado e que as policies de `realtime.messages` da migracao de chat estao aplicadas.

## Testes

Os testes cobrem a inclusao do access token e a propagacao de erros da API, a validacao de topicos Realtime e o formato de mensagens Broadcast.
