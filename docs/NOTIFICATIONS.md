# Notificações: central e eventos

## Tecnologia e funcionamento

PostgreSQL/Supabase guarda a central; Supabase Auth/RLS isola cada destinatário; Realtime avisa o frontend para atualizar o React Query. A interface usa React Bootstrap. As tabelas de negócio e chat estão no mesmo projeto Supabase, conforme confirmado para este ambiente.

A central possui sino sem borda, badge no canto superior direito, filtros todas/não lidas, paginação por cursor e leitura individual/em lote. O sino usa preenchimento colorido quando há não lidas e contorno com a cor do tema quando está vazio, para preservar contraste em fundo claro e escuro.

Eventos são registrados na fila privada junto da transação de origem. O Supabase Cron processa até 100 eventos a cada 10 segundos; cada evento resolvido gera notificações com chave idempotente. A geração não depende de Render ativo, webhook, Edge Function, novas chaves ou chamada externa. A configuração usa recursos e cotas do Supabase existente.

Uma falha no processamento reverte apenas a geração daquele aviso e agenda nova tentativa, sem desfazer a mensagem/ação já salva. A gravação da fila em si faz parte da transação original: uma falha estrutural nessa gravação pode abortar a transação, como qualquer outra escrita no banco. Não há promessa de funcionamento caso o banco/schema esteja indisponível.

## Eventos implementados

| Evento                            | Destinatário                                                                        | Destino      |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------ |
| Nova mensagem direta              | Outra pessoa, se a amizade ainda estiver aceita                                     | Conversa     |
| Mensagem de equipe                | Membros atuais, exceto remetente; equipe não arquivada                              | Conversa     |
| Mensagem de agendamento           | Organizador/participantes atuais, exceto remetente; evento não cancelado/finalizado | Conversa     |
| Solicitação de amizade            | Pessoa convidada                                                                    | Social       |
| Amizade aceita                    | Autor da solicitação                                                                | Social       |
| Convite para equipe               | Pessoa convidada, se o autor ainda é capitão                                        | Equipes      |
| Solicitação para entrar na equipe | Capitães atuais                                                                     | Equipes      |
| Convite de equipe aceito          | Capitães atuais                                                                     | Equipes      |
| Solicitação de entrada aceita     | Pessoa aprovada                                                                     | Equipes      |
| Entrada em agendamento            | Organizador, exceto sua própria inscrição                                           | Agendamentos |
| Agendamento cancelado             | Participantes atuais, exceto organizador                                            | Agendamentos |

Os destinatários são consultados no estado atual das tabelas de negócio. Não dependem de ter aberto a conversa antes. Convites já resolvidos e notificações de acesso revogado antes do processamento são descartados. Mensagens geram um aviso por mensagem e destinatário, sem copiar o conteúdo da conversa para a central. Notificações históricas já entregues não são apagadas ao mudar um vínculo; abrir um destino continua sujeito à autorização normal da aplicação.

O chat mantém seu fluxo atual de persistência e Realtime. A central pode levar aproximadamente 0–10 segundos para receber um aviso em condições normais; filas maiores, erros, pausa do projeto ou execução do Cron podem aumentar esse prazo. Repetir o processamento do mesmo evento não duplica nem restaura como não lido um aviso já entregue.

A abertura de uma conversa visível marca os avisos daquela conversa como lidos; uma aba oculta não os reconhece. Novos avisos de amizade/equipe/agendamento invalidam somente os caches de negócio associados à conta. Ao recuperar foco/conexão, as telas ativas sincronizam novamente para compensar eventos Realtime perdidos. Uma atualização de leitura não provoca nova busca de todos os dados de negócio.

## Passos externos para ativar

A base `20261118180000_notification_inbox.sql` já foi aplicada e validada. **Não a execute novamente.**

1. No mesmo projeto Supabase, habilite **Cron (`pg_cron`)** em Integrations → Cron (ou Database → Extensions, conforme a interface disponível).
2. No SQL Editor, aplique os arquivos novos **na ordem abaixo**, cada um dentro de `BEGIN;` / `COMMIT;`, ou pelo seu processo Supabase CLI já estabelecido:
   - `supabase/migrations/20261118190000_notification_events.sql`
   - `supabase/migrations/20261118190100_chat_notification_projection.sql`
   - `supabase/migrations/20261118190200_social_notification_projection.sql`
   - `supabase/migrations/20261118190300_appointment_notification_projection.sql`
   - `supabase/migrations/20261118190400_notification_event_processor.sql`
3. Depois de aplicar **todos** os arquivos, execute `supabase/setup/notifications-cron.sql`. O primeiro job processa os eventos; o segundo remove somente os logs desses jobs com mais de sete dias. Eventos já processados também são limpos após sete dias pelo processador. Eventos com falha permanecem para inspeção.
4. Confira a ativação:

   ```sql
   select jobid, jobname, schedule, active
   from cron.job
   where jobname like 'techarena-notification%';

   select schemaname, tablename from pg_publication_tables
   where pubname = 'supabase_realtime' and tablename = 'notifications';
   ```

O retorno de `cron.schedule` é o ID do job, não a confirmação de entrega. Antes de testar uma nova ação, confirme que o processador foi criado:

   ```sql
   select to_regprocedure('public.process_notification_events(integer)');
   select public.process_notification_events(100);
   ```

Se a primeira consulta retornar `NULL`, aplique e confirme com `COMMIT` a migration `20261118190400_notification_event_processor.sql`. Um retorno `0` na segunda consulta indica que nenhum evento foi concluído nessa chamada; o Cron pode já ter consumido a fila. Confira as tentativas e erros na seção de monitoramento.

As migrations de funções `190100`, `190200`, `190300` e `190400` permitem reexecução com `CREATE OR REPLACE FUNCTION`. Isso não se aplica às migrations anteriores de tabelas e gatilhos.

5. Publique o código pelo fluxo normal. Não há variável nova. Permanecem `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no build frontend, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no runtime backend. A service role nunca vai para o frontend.

Esses arquivos são migrações do **Supabase**, não do TypeORM. O deploy atual não as aplica automaticamente. Não é necessário adicionar a fila privada ao Realtime, expô-la na API ou criar webhook. As migrações pressupõem todas as migrações atuais do backend, inclusive `archived_at` de equipes.

Para ambiente novo, aplique primeiro o schema do backend, a migração de chat e a base da central. A captura afeta somente acontecimentos novos, sem disparar notificações retroativas de todas as mensagens existentes.

## Validação no projeto publicado

Use duas contas de teste:

1. Envie uma solicitação de amizade. A segunda conta deve receber o aviso e a tela Social deve atualizar sem reload; aceite e confira o aviso na primeira conta.
2. Envie mensagem com a conversa do destinatário fechada: o badge deve aumentar em alguns segundos e o aviso deve abrir a conversa correta. Com a conversa visível, os avisos correspondentes devem ser reconhecidos. Uma aba oculta não deve marcá-los como lidos.
3. Convide a segunda conta para uma equipe. Ela recebe o convite; após aceitar, o capitão recebe a confirmação. Teste também uma solicitação de entrada.
4. Entre em um agendamento criado pela primeira conta; somente o organizador recebe o aviso de entrada. Cancelamentos notificam os participantes.
5. Confira que uma terceira conta fora dos vínculos não recebe esses avisos.

Ainda **não há Web Push**, notificações do sistema operacional, permissão do navegador ou entrega fora do app. Esse será um canal adicional. As notificações não equivalem a recibo de leitura de mensagens pelo interlocutor. Eventos de ligas, recusas, bloqueios e saídas ainda não geram avisos.

## Monitoramento e recuperação

```sql
-- Estado da fila. attempts=10 exige intervenção; a entrega não fica tentando indefinidamente.
select kind, attempts, count(*)
from notification_private.events
where processed_at is null
 group by kind, attempts order by kind, attempts;

  select id, kind, attempts, available_at, last_error_code
  from notification_private.events
  where processed_at is null order by created_at limit 100;

  -- Somente após corrigir a causa, use o UUID específico do evento afetado:
  -- update notification_private.events set attempts=0, available_at=now(), last_error_code=null
  -- where id='UUID-DO-EVENTO' and processed_at is null;

  -- Processamento manual seguro/idempotente, sem depender do próximo tick:
  select public.process_notification_events(100);
```

As falhas guardam apenas SQLSTATE, sem corpo de mensagem ou segredo. Novas tentativas usam espera crescente até cinco minutos, com limite de dez falhas. Lotes usam locks com `SKIP LOCKED`, permitindo execução concorrente sem processar a mesma linha duas vezes. Cada lote confirma suas notificações e o estado da fila na mesma transação.

Para pausar apenas a geração, desative o job `techarena-notification-events` no painel Cron. Os eventos continuam sendo capturados e aguardam. Não remova a tabela da fila com os triggers ativos. Avalie retenção e agrupamento da central antes de grandes volumes; registros da central ainda não são excluídos automaticamente.

## Contratos e testes

O módulo Nest `NotificationsModule` exporta `NOTIFICATIONS` para produtores confiáveis futuros. A integração dos eventos atuais usa projeções SQL sobre a fila porque chat e negócio compartilham o banco; não chama o adapter HTTP do Nest dentro de transações. O frontend não possui permissão de criar notificações, mudar destinatários ou executar o processador.

`npm run test:notifications` na pasta backend exige `DATABASE_URL` apontando para um servidor PostgreSQL/PostGIS **descartável, loopback e banco terminado em `_test`**. Cria um banco isolado, aplica as migrações reais, executa os testes e remove esse banco. O comando está incluído no estágio de integração da CI.

Os testes SQL cobrem isolamento, idempotência, destinos, primeiro contato sem chat previamente aberto, bloqueio/remoção antes da entrega, rollback da origem, falha simulada de geração e nova tentativa. A simulação local de Auth/Realtime valida políticas e SQL; não certifica a configuração do serviço hospedado. Execute também a validação de duas contas acima.

Referências: [Supabase Cron](https://supabase.com/docs/guides/cron), [agendamento em segundos](https://supabase.com/docs/guides/cron/quickstart), [Realtime e RLS](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
