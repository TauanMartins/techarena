CREATE TABLE IF NOT EXISTS public.chat_conversations (
    topic text PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('direct', 'team', 'appointment')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    topic text NOT NULL REFERENCES public.chat_conversations(topic) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name varchar(150) NOT NULL DEFAULT 'Atleta',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (topic, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic text NOT NULL REFERENCES public.chat_conversations(topic) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name varchar(150) NOT NULL,
    body varchar(1000) NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 1000),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_topic_history_index
    ON public.chat_messages (topic, created_at DESC, id DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA realtime TO authenticated;
REVOKE ALL ON TABLE public.chat_conversations, public.chat_participants, public.chat_messages
    FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.chat_conversations, public.chat_participants TO authenticated;
GRANT SELECT ON TABLE public.chat_messages TO authenticated;
GRANT INSERT (topic, sender_id, body) ON TABLE public.chat_messages TO authenticated;
GRANT ALL ON TABLE public.chat_conversations, public.chat_participants, public.chat_messages
    TO service_role;
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON TABLE realtime.messages TO authenticated;

DROP POLICY IF EXISTS chat_conversations_read_participant ON public.chat_conversations;
CREATE POLICY chat_conversations_read_participant ON public.chat_conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS participant
            WHERE participant.topic = chat_conversations.topic
              AND participant.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS chat_participants_read_self ON public.chat_participants;
CREATE POLICY chat_participants_read_self ON public.chat_participants
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS chat_messages_read_participant ON public.chat_messages;
CREATE POLICY chat_messages_read_participant ON public.chat_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS participant
            WHERE participant.topic = chat_messages.topic
              AND participant.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS chat_messages_insert_participant ON public.chat_messages;
CREATE POLICY chat_messages_insert_participant ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.chat_participants AS participant
            WHERE participant.topic = chat_messages.topic
              AND participant.user_id = (SELECT auth.uid())
        )
    );

CREATE OR REPLACE FUNCTION public.set_chat_message_sender_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT participant.display_name
      INTO NEW.sender_name
      FROM public.chat_participants AS participant
     WHERE participant.topic = NEW.topic
       AND participant.user_id = NEW.sender_id;
    IF NEW.sender_name IS NULL THEN
        RAISE EXCEPTION 'Chat sender is not a registered participant';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_message_sender_name ON public.chat_messages;
CREATE TRIGGER chat_message_sender_name
    BEFORE INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.set_chat_message_sender_name();

DROP POLICY IF EXISTS realtime_team_chat_read ON realtime.messages;
DROP POLICY IF EXISTS realtime_team_chat_send ON realtime.messages;
DROP POLICY IF EXISTS realtime_appointment_chat_read ON realtime.messages;
DROP POLICY IF EXISTS realtime_appointment_chat_send ON realtime.messages;
DROP POLICY IF EXISTS realtime_direct_chat_read ON realtime.messages;
DROP POLICY IF EXISTS realtime_direct_chat_send ON realtime.messages;
DROP POLICY IF EXISTS realtime_chat_read_participant ON realtime.messages;
CREATE POLICY realtime_chat_read_participant ON realtime.messages
    FOR SELECT TO authenticated
    USING (
        realtime.messages.extension IN ('broadcast', 'presence')
        AND split_part(realtime.topic(), ':', 1) = 'chat'
        AND EXISTS (
            SELECT 1 FROM public.chat_participants AS participant
            WHERE participant.topic = substring(realtime.topic() FROM 6)
              AND participant.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS realtime_chat_send_participant ON realtime.messages;
CREATE POLICY realtime_chat_send_participant ON realtime.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        realtime.messages.extension IN ('broadcast', 'presence')
        AND split_part(realtime.topic(), ':', 1) = 'chat'
        AND EXISTS (
            SELECT 1 FROM public.chat_participants AS participant
            WHERE participant.topic = substring(realtime.topic() FROM 6)
              AND participant.user_id = (SELECT auth.uid())
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        RAISE EXCEPTION 'Supabase Realtime publication supabase_realtime is missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
