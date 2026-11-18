-- Inbox only: no chat/friend/team triggers and no push dispatch in this migration.
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key varchar(200) NOT NULL CHECK (length(btrim(event_key)) > 0),
  kind varchar(80) NOT NULL CHECK (kind ~ '^[a-z][a-z0-9_.]*$'),
  title varchar(120) NOT NULL CHECK (length(btrim(title)) > 0),
  body varchar(500) NOT NULL CHECK (length(btrim(body)) > 0),
  target_path varchar(300) CHECK (
    target_path ~ '^/(chat|social|equipes|agendamentos|ligas|notificacoes)(/[a-zA-Z0-9_-]+)*$'
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (recipient_id, event_key)
);
CREATE INDEX notifications_inbox ON public.notifications(recipient_id, created_at DESC, id DESC);
CREATE INDEX notifications_unread ON public.notifications(recipient_id) WHERE read_at IS NULL;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY notifications_read_own ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = (SELECT auth.uid()));

-- Clients can acknowledge only their own records; content and recipient are immutable to them.
CREATE FUNCTION public.mark_notifications_read(notification_id uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE affected integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  UPDATE public.notifications SET read_at = now()
    WHERE recipient_id = auth.uid() AND read_at IS NULL
      AND (notification_id IS NULL OR id = notification_id);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_notifications_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ELSE
    RAISE EXCEPTION 'Supabase Realtime publication is missing';
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
