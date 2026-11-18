-- Resolve recipients from current business membership, not only users who opened the chat before.
CREATE FUNCTION notification_private.chat_recipients(topic text, sender uuid)
RETURNS TABLE(recipient_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE parts text[] := string_to_array(topic,':'); first_user uuid; second_user uuid; entity bigint;
BEGIN
  IF parts[1]='direct' AND array_length(parts,1)=3 THEN
    first_user := parts[2]::uuid; second_user := parts[3]::uuid;
    RETURN QUERY SELECT CASE WHEN sender=first_user THEN second_user ELSE first_user END
      WHERE sender IN(first_user,second_user) AND EXISTS(
        SELECT 1 FROM public.friend f WHERE f.status='accepted' AND
          ((f.requester_id=first_user AND f.addressee_id=second_user) OR (f.requester_id=second_user AND f.addressee_id=first_user)));
  ELSIF parts[1]='team' AND array_length(parts,1)=2 THEN
    entity := parts[2]::bigint;
    RETURN QUERY SELECT m.user_id FROM public.user_team m JOIN public.team t ON t.id=m.team_id
      WHERE m.team_id=entity AND m.user_id<>sender AND t.archived_at IS NULL
        AND EXISTS(SELECT 1 FROM public.user_team own WHERE own.team_id=entity AND own.user_id=sender);
  ELSIF parts[1]='appointment' AND array_length(parts,1)=2 THEN
    entity := parts[2]::bigint;
    RETURN QUERY SELECT ids.user_id FROM public.appointment a
      CROSS JOIN LATERAL (SELECT a.organizer_id AS user_id UNION SELECT u.user_id FROM public.user_appointment u WHERE u.appointment_id=a.id) ids
      WHERE a.id=entity AND a.deleted_at IS NULL AND a.status IN('scheduled','in_progress') AND ids.user_id<>sender
        AND (a.organizer_id=sender OR EXISTS(SELECT 1 FROM public.user_appointment own WHERE own.appointment_id=entity AND own.user_id=sender));
  END IF;
END $$;
CREATE FUNCTION notification_private.project_chat(event_id uuid, payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE msg public.chat_messages%ROWTYPE; parts text[];
BEGIN
  SELECT * INTO msg FROM public.chat_messages WHERE id=(payload->>'id')::uuid;
  IF NOT FOUND THEN RETURN; END IF;
  parts := string_to_array(msg.topic,':');
  INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path,created_at)
    SELECT r.recipient_id, 'event:'||event_id, 'chat.message', 'Nova mensagem',
      left(msg.sender_name,80)||' enviou uma mensagem.',
      '/chat/'||parts[1]||'/'||CASE WHEN parts[1]='direct' THEN msg.sender_id::text ELSE parts[2] END,
      msg.created_at
    FROM notification_private.chat_recipients(msg.topic,msg.sender_id) r
    JOIN auth.users u ON u.id=r.recipient_id
    ON CONFLICT(recipient_id,event_key) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION notification_private.chat_recipients(text,uuid), notification_private.project_chat(uuid,jsonb) FROM PUBLIC,anon,authenticated;

-- Opening a visible conversation acknowledges only that account's chat notices.
CREATE FUNCTION public.mark_chat_notifications_read(conversation_path text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE affected integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
  IF conversation_path !~ '^/chat/(direct|team|appointment)/[a-zA-Z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid conversation path' USING ERRCODE='22023';
  END IF;
  UPDATE public.notifications SET read_at=now() WHERE recipient_id=auth.uid() AND kind='chat.message'
    AND target_path=conversation_path AND read_at IS NULL;
  GET DIAGNOSTICS affected=ROW_COUNT;
  RETURN affected;
END $$;
REVOKE ALL ON FUNCTION public.mark_chat_notifications_read(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_chat_notifications_read(text) TO authenticated;
NOTIFY pgrst,'reload schema';
