# CI, versões e publicação

## Fluxo

1. Criar uma branch a partir da `main`; manter o PR como draft até estar pronto.
2. PR pronto: `CI` executa lint, formatação do frontend, testes com cobertura,
   builds e integração com PostgreSQL/PostGIS descartável. Não acessa produção.
3. `Enable auto-merge` habilita squash automático apenas para PRs do dono do
   repositório, criados no próprio repositório. Nunca executa código do PR com
   credenciais privilegiadas. Contribuições externas exigem habilitação manual.
4. A proteção da `main` precisa exigir o check `CI` e branch atualizada.
5. Depois do merge, a CI valida o commit integrado. `Release and deploy` é
   disparado por essa CI concluída com sucesso, somente em pushes na `main`.
6. Release Please cria/atualiza um PR com versões e changelogs dos componentes
   alterados. A GitHub App habilita o auto-merge desse PR sem bypass dos checks.
7. O merge do PR de release passa novamente pela CI. Release Please cria as
   tags e GitHub Releases; apenas os componentes com tag nesse SHA são publicados.
8. Se backend e frontend mudarem juntos, publicar backend, aguardar o deploy
   exato e validar `/health`, depois publicar e verificar o frontend.

O primeiro PR de configuração deve ser integrado manualmente após a CI, pois o
workflow de auto-merge só estará disponível na branch padrão depois desse merge.
Não se cria versão só por abrir um PR. Uma tag é um registro de release; seu
sucesso de publicação deve ser conferido no job `deploy` e no environment
`production`. Não se movem tags para corrigir um deploy.

## Componentes e commits

`frontend/` e `backend/` têm versões independentes. Release Please atualiza
`package.json`, `package-lock.json`, `CHANGELOG.md` e o manifest da raiz.
As tags são `frontend-vX.Y.Z` e `backend-vX.Y.Z`.

- `fix`: patch; `feat`: minor; `!` ou `BREAKING CHANGE`: major.
- `docs`, `ci`, `test`, `chore`, `refactor`: não geram release por padrão.
- O tipo é o do squash commit: mantenha o título e corpo do PR corretos.
- Um PR `feat` que altera os dois componentes pode incrementar minor em ambos.
- Arquivos apenas na raiz, como os workflows, não liberam componentes sozinhos.
- Mudanças de dependências que precisam de publicação devem usar um tipo
  apropriado, por exemplo `fix(backend): update vulnerable runtime dependency`.
- Os marcadores `Release-As` do Release Please permitem uma versão excepcional
  explícita quando necessário; não editar tags existentes.

A versão inicial vem dos manifests existentes: frontend `0.0.0`, backend
`0.0.1`. A base de bootstrap é o commit anterior à implantação da CI,
`3381cd9a870990303c5d902b87d60cab7548c851`; commits anteriores não são relançados.

## Configuração no GitHub

Repository variables (Settings > Secrets and variables > Actions):

| Nome | Uso |
| --- | --- |
| `RELEASE_APP_ID` | ID da GitHub App privada |
| `PRODUCTION_DEPLOY_ENABLED` | `true` somente depois de desativar deploys nativos nos provedores |

Repository secret: `RELEASE_APP_PRIVATE_KEY`, conteúdo completo da chave PEM.
Instalar a App somente neste repositório, sem webhook, com Contents,
Pull requests e Issues em read/write; Metadata read é implícita. Não conceder
bypass das regras da `main`. O token temporário da App permite que a CI execute
nos PRs de release (o GITHUB_TOKEN comum não encadeia esses eventos).

No environment `production`, restringir deploys à `main` e cadastrar:

| Tipo | Nome |
| --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` |
| Secret | `RENDER_API_KEY` |
| Variable | `CLOUDFLARE_ACCOUNT_ID` |
| Variable | `RENDER_SERVICE_ID` |
| Variable | `BACKEND_URL` |
| Variable | `FRONTEND_URL` |
| Variable | `VITE_API_BASE_URL` |
| Variable | `VITE_SUPABASE_URL` |
| Variable | `VITE_SUPABASE_PUBLISHABLE_KEY` |

`CI` deve ser obrigatório no ruleset da `main`, com branch atualizada antes do
merge. Ativar Allow auto-merge e squash usando título e corpo do PR. O workflow
recusa habilitar auto-merge se não encontrar `CI` entre os checks do ruleset.

## Ativação e operação

1. Configurar a App e as variáveis/secrets; integrar os workflows após CI aprovada.
2. No Render, desligar Auto-Deploy. Manter build/start, variáveis e health check
   existentes. A API recebe `commitId` específico; não usa latest.
3. No Cloudflare, desativar builds automáticos de produção e previews, ou
   desconectar a integração Git sem apagar o Worker. O Actions usa Wrangler.
4. Definir a repository variable `PRODUCTION_DEPLOY_ENABLED=true`.
5. Integrar uma alteração real `fix` ou `feat`; acompanhar o PR automático de
   release, seus checks, tags e deploys.

O frontend mostra sua versão no rodapé desktop e ao final de Configurações no
celular. O Vite incorpora a versão do `frontend/package.json` no build, sem uma
requisição extra e sem depender da versão de outro deploy em cache.
O backend lê `backend/package.json` e expõe a mesma versão no campo `version`
de `/health` e no Swagger. O Release Please mantém esses arquivos atualizados.

O frontend gera `/version.json` com tag e SHA; a esteira confere esse arquivo
após publicar. O backend é validado pelo SHA retornado pela API do Render e
pela resposta de `/health`. Não são necessárias credenciais do banco no Actions.
Migrations de produção continuam sendo uma operação separada e revisada: este
workflow não as aplica. Alterações de banco e API precisam ser compatíveis com
a versão anterior durante o deploy. Falha do frontend não desfaz o backend.

Os workflows de release/deploy são serializados sem cancelar um deploy ativo.
O GitHub pode substituir execuções pendentes por outras mais novas. A rotina
recusa processar automaticamente um SHA que já não seja o topo da main; a CI
mais recente processa o release PR. Se uma tag já criada não foi publicada,
use a recuperação abaixo. Não existe garantia de publicação de todo commit
intermediário quando vários merges ocorrem em sequência rápida.

### Recuperar publicação sem criar outra versão

Actions > Release and deploy > Run workflow, usando a branch `main`, informe
em `release_sha` o SHA completo do commit de release. A rotina exige que ele
pertença ao histórico da main, tenha CI de push aprovada e tags de release
correspondentes aos package.json. Republica os componentes com tags nesse SHA,
sem incrementar versões ou executar o Release Please. Também permite rollback
explícito de aplicação para uma release anterior, sujeito à compatibilidade do
banco. Use o SHA atual da release desejada para evitar rebaixamento acidental.

Falhas anteriores à criação das tags devem ser retomadas por Re-run jobs na
execução automática original, depois de corrigir sua causa.

## Validação local

```sh
python3 -m unittest discover -s .github/tests -v
```

Os testes de deploy simulam respostas do Render: conclusão correta, SHA errado,
falha de build, timeout e banco indisponível. Não publicam nada. A CI de aplicação
continua executando ambos os componentes e disponibiliza cobertura por sete dias.
