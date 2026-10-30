# Autenticação de aplicações client-side

O frontend usa Supabase Auth (por exemplo, Google OAuth) para obter uma sessão.
Cada chamada protegida envia `Authorization: Bearer <session.access_token>`.
Não envie o ID token do Google, refresh token, chave publishable ou service role
como credencial da API. O frontend renova a sessão pelo SDK do Supabase e repete a
requisição quando necessário; o backend não emite sessões próprias nem lê cookies.

## Onde obter a URL e a publishable key

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) e selecione o projeto
   usado pelo frontend para autenticar os usuários.
2. Clique em **Connect**. O diálogo mostra a URL do projeto e a publishable key para
   integração com o SDK. Copie a URL HTTPS, por exemplo `https://seu-projeto.supabase.co`.
3. Para consultar ou criar uma publishable key específica, abra **Settings > API Keys**.
   A chave atual tem o prefixo `sb_publishable_`.

Em `SUPABASE_URL`, coloque somente a URL base do projeto: sem `/auth/v1`, sem o endpoint
JWKS e sem a URL de conexão PostgreSQL. Frontend e backend devem apontar para o mesmo
projeto Auth. O banco da aplicação pode continuar sendo o PostgreSQL local.

| Componente | Configuração utilizada |
|---|---|
| Frontend client-side com SDK Supabase | URL do projeto e publishable key para inicializar o cliente e realizar o login |
| Backend NestJS atual | `SUPABASE_URL` para localizar as chaves públicas de assinatura; não usa publishable key |
| Chamada do frontend ao NestJS | Access token da sessão no header `Authorization: Bearer ...` |

A publishable key identifica a aplicação perante as APIs do Supabase. Ela não é o
access token do usuário nem uma chave pública de assinatura JWT. O frontend pode
utilizá-la; secret key e service role não devem ser colocadas no navegador. Não é
necessário adicionar uma publishable key ao `.env` do backend nesta implementação.

Fonte: [API keys e Connect dialog](https://supabase.com/docs/guides/getting-started/api-keys).

## Configuração local

No Compose, copie os templates da raiz para os arquivos de ambiente dos serviços:

```sh
cp .env.frontend.example .env.frontend
cp .env.backend.example .env.backend
```

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.frontend`;
configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` e `CORS_ORIGINS`
em `.env.backend`. Nunca coloque a service role key no arquivo do frontend. Execute
`docker compose up -d` para aplicar a configuração aos containers. Na execução direta
no host, use `backend/.env`. A leitura e validação continuam centralizadas em
`src/config/environment.ts`.
Sem URL de Auth, o health check funciona; chamadas protegidas com Bearer recebem 503.
Não existe bypass de autenticação no ambiente local.

## Como o backend verifica a origem do access token

O Supabase Auth assina o JWT com a chave privada do projeto. O adaptador NestJS
obtém as chaves públicas correspondentes no endpoint do projeto configurado:

```text
GET <SUPABASE_URL>/auth/v1/.well-known/jwks.json
```

Esse endpoint JWKS é público e não exige publishable key. A biblioteca `jose` verifica
a assinatura com essas chaves. O backend também exige que o emissor (`iss`) seja
`<SUPABASE_URL>/auth/v1`, a audiência (`aud`) seja `authenticated`, o token não esteja
expirado e o sujeito (`sub`) seja um UUID válido. Exige ainda papel `authenticated`
e rejeita usuários anônimos e tokens service role.

Assim, o projeto Supabase configurado é a fonte de confiança. O backend não escolhe
um servidor de chaves a partir de uma URL informada pelo cliente ou pelo próprio token.
Ler ou decodificar um JWT sem verificar sua assinatura não seria suficiente.

O adaptador atual aceita **ES256/RS256**. Projetos com signing key legada **HS256**
precisam migrar para uma chave assimétrica antes de usá-lo. A alternativa documentada
pelo Supabase para HS256 é verificar online em `/auth/v1/user`, enviando access token
mais publishable key em `apikey`; esse fluxo não está implementado neste backend.
A API atual não precisa de publishable key, service role nem JWT secret para validar JWTs.

Fonte: [Verificação de JWTs do Supabase](https://supabase.com/docs/guides/auth/jwts)
e [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys).

As chaves são armazenadas em cache por no máximo 10 minutos. Falhas de rede não
liberam acesso. A validação local de JWT não consulta revogação de sessão a cada
requisição: um token válido pode continuar aceito até expirar após logout. Use TTL
curto no projeto e planeje verificação online se o negócio exigir revogação imediata.

Um guard global protege rotas por padrão; somente handlers com `@Public()` são
públicos. `/health` é público e verifica PostgreSQL, sem revelar configurações.
O Swagger permite informar o Bearer em Authorize. Roles de negócio e propriedade
são avaliadas pelo backend, nunca por `user_metadata` ou um userId enviado no corpo.

## Consultar o perfil após autorizar no Swagger

Cole o access token em **Authorize** (sem o prefixo Bearer) e execute `GET /users/me`.
O perfil deve ter sido criado pelo trigger de `auth.users` em `public.users` no banco
usado pela API. Não existe `POST /users/me`. Token inválido retorna 401; token válido
sem perfil retorna 404 `PROFILE_NOT_FOUND`. Um trigger no Supabase não preenche um
PostgreSQL local separado: confira o destino de `DATABASE_URL`.
