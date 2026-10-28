# Chat com Supabase Realtime

O banco da aplicação não mantém tabelas próprias de `chat`, `message` ou `user_chat`. O transporte usa canais privados do Supabase Realtime, autenticados pelo JWT do Supabase. A migration `2026_10_27_210200_align_supabase_auth_and_realtime_chat.php` arquiva tabelas antigas no schema `legacy` sem apagar o histórico.

Use tópicos estáveis derivados do contexto:

- `team:<team_id>` para conversas de times;
- `appointment:<appointment_id>` para conversas de agendamentos;
- `direct:<uuid_menor>:<uuid_maior>` para conversas entre duas pessoas. Ordene os UUIDs em ordem lexicográfica e use letras minúsculas.

Os tópicos devem ser privados (`private: true` no cliente), e a opção Allow public access do Realtime deve ser desativada no projeto Supabase. O Supabase já habilita e gerencia RLS em `realtime.messages`; a migration apenas instala policies, sem alterar a tabela gerenciada. As políticas em `realtime.messages` autorizam envio e leitura para membros do time, participantes/organizadores do agendamento e amizades aceitas. Uma conversa direta sem amizade aceita não é autorizada. O cliente Angular deve obter sessão/JWT pelo Supabase Auth e conectar ao Realtime; o NestJS continua responsável pelas operações de domínio e não deve confiar em `topic` enviado sem validação do Realtime.

Esse desenho não cria histórico de mensagens na aplicação. Broadcast/Presence são efêmeros; se o produto precisar de histórico, retenção, busca ou moderação, isso exige uma estratégia explícita de persistência no Supabase e políticas próprias antes de ativá-la.

A FK `public.users.id → auth.users.id ON DELETE CASCADE` é intencional: o trigger mantém o perfil sincronizado e a FK impede perfis órfãos. A tabela `public.users` é somente o perfil associado a `auth.users.id`. O trigger de cadastro deve inserir em `public.users` depois da criação de `auth.users`; campos de perfil e `permission_id` são opcionais para não fazer o login depender de metadados do Google ou de seeders. A migration concede `USAGE` no schema `public` e `INSERT` apenas em `public.users` ao papel interno `supabase_auth_admin`, com uma policy de inserção limitada a esse papel; a FK valida o UUID. Mantenha o trigger como `AFTER INSERT` e prefira a função `SECURITY DEFINER` recomendada pelo Supabase. A migration não recria nem substitui o trigger existente.
