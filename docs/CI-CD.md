# CI, versões e publicação

## Fluxo

1. Criar uma branch a partir da `main`; manter o PR como draft até estar pronto.
2. PR pronto: `CI` seleciona os componentes alterados e executa lint, formatação
   do frontend, testes com cobertura, builds e integração do backend com PostGIS
   descartável quando aplicável. Arquivos compartilhados ou desconhecidos validam
   ambos. Alterações somente em `docs/` ou `README.md` executam apenas automação.
   O workflow `PR title` valida o Conventional Commit separadamente.
3. Após o check `CI` passar, o job `Enable auto-merge after CI` da mesma
   execução habilita squash automático para PRs do dono do repositório, criados
   no próprio repositório e fora de draft. Esse job não faz checkout nem executa
   código do PR. Revalida o SHA e estado atuais antes de habilitar o merge.
   Se o GitHub recusar a habilitação com estado `unstable`, tenta o squash com
   o SHA validado pela API normal, que continua sujeita aos dois checks e demais
   regras da branch. A App não tem bypass. Outros erros não acionam essa tentativa.
   Contribuições externas exigem habilitação manual.
4. A proteção da `main` exige `CI`, `Conventional PR title` e branch atualizada.
   O título bloqueia o merge independentemente do resultado dos testes.
5. Depois do merge, a CI valida o commit integrado. `Release and deploy` é
   disparado por essa CI concluída com sucesso, somente em pushes na `main`.
6. Release Please cria/atualiza um PR com versões e changelogs dos componentes
   alterados. A GitHub App habilita o auto-merge desse PR sem bypass dos checks.
7. O merge do PR de release passa novamente pela CI. Release Please cria as
   tags e GitHub Releases; apenas os componentes com tag nesse SHA são publicados.
8. Antes de publicar, validar toda a configuração dos componentes selecionados
   e construir o frontend de produção. Depois publicar backend, conferir SHA,
   saúde e versão no `/health`; por último publicar e verificar o frontend.

Não se cria versão só por abrir um PR. Uma tag é um registro de release; seu
sucesso de publicação deve ser conferido no job `deploy` e no environment
`production`. Não se movem tags para corrigir um deploy.

### Por que há mais de uma execução?

O PR da feature e o PR de versão passam por CI antes e depois de cada merge:
são quatro validações de commits diferentes, com seleção de componentes nos PRs
e validação completa nos pushes da `main` e execuções manuais. O deploy exige
CI de push aprovada para o SHA exato publicado. Editar título ou descrição executa
apenas `PR title`, sem repetir builds, testes ou cancelar um CI em andamento.
O check agregador `CI` aceita skips apenas quando o seletor explicitamente
dispensou o componente. Falhas, cancelamentos e seleção inválida bloqueiam o PR.

Depois do merge da feature, `Release and deploy` prepara o PR de versão e deixa
`deploy` como skipped, pois ainda não existe tag naquele commit. Depois do merge
do PR de versão, cria as tags e publica. O auto-merge do PR do bot é habilitado
pelo próprio job de release; o job de auto-merge do CI é exclusivo do proprietário.
Não existe mais workflow separado nem gatilho `pull_request_target`, portanto
não é necessário liberar esse evento na política de Actions.

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
| `RELEASE_APP_CLIENT_ID` | Client ID da GitHub App privada (não o App ID numérico) |
| `PRODUCTION_DEPLOY_ENABLED` | `true` somente depois de desativar deploys nativos nos provedores |

O Client ID está em Settings > Developer settings > GitHub Apps > sua App.
A migração de `RELEASE_APP_ID` não exige recriar a App ou sua chave privada.

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

`CI` e `Conventional PR title` devem ser obrigatórios no ruleset da `main`,
com branch atualizada antes do merge. Ativar Allow auto-merge e squash usando título e corpo do PR. O workflow
recusa habilitar auto-merge se não encontrar ambos os checks no ruleset.

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
pela saúde do banco e versão esperada na resposta de `/health`. Não são necessárias credenciais do banco no Actions.
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

### Ferramentas e validações da automação

A versão do npm usada nos jobs de aplicação e no build de produção do frontend
vem de `.npm-version`; o Node vem de `backend/.nvmrc`. O Render continua construindo
o backend no seu próprio ambiente; mantenha esse runtime compatível com os engines
do pacote. O actionlint roda no job de automação com versão e SHA-256 fixados.

Os testes da automação cobrem seleção de componentes, skips inesperados, configuração
incompleta, tags incompatíveis e versão incorreta no health. A pré-validação confirma
presença e formato das configurações; não comprova que tokens continuam autorizados
nos provedores. Falhas remotas ainda podem interromper a publicação.
