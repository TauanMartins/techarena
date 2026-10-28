# Autenticação de aplicações client-side

O frontend usa Supabase Auth (por exemplo, Google OAuth) para obter uma sessão.
Cada chamada protegida envia `Authorization: Bearer <session.access_token>`.
Não envie o ID token do Google, refresh token, chave publishable ou service role
como credencial da API. O frontend renova a sessão pelo SDK do Supabase e repete a
requisição quando necessário; o backend não emite sessões próprias nem lê cookies.

Configure `SUPABASE_URL=https://<project>.supabase.co` e as origens do frontend em
`CORS_ORIGINS` (separadas por vírgulas). A configuração é centralizada. No Compose,
exporte essas variáveis ou defina-as no `.env` da raiz. Para execução no host, use
`backend/.env`. Sem URL de Auth, o health check funciona; chamadas protegidas com
Bearer recebem 503. Não existe bypass de autenticação no ambiente local.

O adaptador valida JWTs ES256/RS256 usando as chaves públicas JWKS do projeto,
assinatura, emissor, audiência `authenticated`, expiração, UUID do sujeito e papel
`authenticated`. Tokens de usuários anônimos e service role não são aceitos. Projetos
com a chave legada HS256 devem migrar para uma signing key assimétrica antes de usar
este adaptador. A API não precisa de service role nem JWT secret.

As chaves são armazenadas em cache por no máximo 10 minutos. Falhas de rede não
liberam acesso. A validação local de JWT não consulta revogação de sessão a cada
requisição: um token válido pode continuar aceito até expirar após logout. Use TTL
curto no projeto e planeje verificação online se o negócio exigir revogação imediata.

Um guard global protege rotas por padrão; somente handlers com `@Public()` são
públicos. `/health` é público e verifica PostgreSQL, sem revelar configurações.
O Swagger permite informar o Bearer em Authorize. Roles de negócio e propriedade
são avaliadas pelo backend, nunca por `user_metadata` ou um userId enviado no corpo.

Referência: https://supabase.com/docs/guides/auth/jwts
