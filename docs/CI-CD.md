# CI e publicação

## Primeira etapa: validação

O workflow `.github/workflows/ci.yml` executa em PRs destinados à `main`, pushes
na `main` e disparos manuais. Todos os componentes são verificados inicialmente,
inclusive quando arquivos compartilhados mudam. Não há filtros de caminhos que
possam deixar um check obrigatório pendente.

- Frontend: lint, formatação, cobertura de testes e build.
- Backend: lint, cobertura de testes e build.
- Integração: PostgreSQL/PostGIS descartável, migrations, seeds e testes E2E.
- PR: título Conventional Commits, usado como mensagem do squash merge.
- Check final `CI`: agrega todos os resultados e falha em caso de erro ou
  cancelamento de um job obrigatório.

A CI não usa secrets nem o environment `production`. O Supabase dos testes é
substituído por verificadores locais; o banco de integração é descartável.
Relatórios de cobertura ficam nos artefatos por sete dias. O build de CI não é
publicado: o build de deploy deverá receber as variáveis públicas de produção.

Depois da primeira execução, configurar `CI` como check obrigatório no ruleset
da `main` e exigir branch atualizada. Habilitar auto-merge individualmente nos
PRs prontos. Em trabalho individual, não exigir aprovação de outro revisor.

## Próximas etapas

Os deploys atuais continuam nos provedores. Este workflow não publica, não muda
versões e não executa migrations de produção.

Para implementar Release Please com PRs de release capazes de disparar a CI:

1. Criar uma GitHub App privada, instalada somente no repositório TechArena.
2. Conceder Repository permissions: Contents (read/write) e Pull requests
   (read/write). Metadata (read) é implícita. Não conceder bypass da `main`.
3. Desabilitar o webhook se a App for usada apenas pelos workflows.
4. Salvar o App ID como repository variable `RELEASE_APP_ID` e a chave privada
   PEM como repository secret `RELEASE_APP_PRIVATE_KEY`.
5. Manter essas credenciais fora do environment `production`: o bot gerencia
   releases, sem precisar das credenciais de hospedagem.

Os workflows de release e deploy serão adicionados na etapa seguinte. Eles
deverão publicar SHAs específicos, serializar publicações, acompanhar o status
no Render e validar a API antes de publicar o frontend quando ambos mudarem.
Só então desabilitar os deploys automáticos equivalentes nos provedores.
