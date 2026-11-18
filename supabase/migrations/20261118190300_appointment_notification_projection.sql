CREATE FUNCTION notification_private.project_appointment(event_id uuid, event_kind text, payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.appointment%ROWTYPE; actor uuid; actor_name text;
BEGIN
  SELECT * INTO a FROM public.appointment WHERE id=(payload->>'id')::bigint;
  IF NOT FOUND THEN RETURN; END IF;
  IF event_kind='appointment.joined' THEN
    actor:=(payload->>'user_id')::uuid;
    IF a.deleted_at IS NOT NULL OR a.status NOT IN('scheduled','in_progress') OR actor=a.organizer_id
      OR NOT EXISTS(SELECT 1 FROM public.user_appointment WHERE appointment_id=a.id AND user_id=actor) THEN RETURN; END IF;
    SELECT left(COALESCE(NULLIF(btrim(name),''),NULLIF(btrim(username),''),'Uma pessoa'),80) INTO actor_name FROM public.users WHERE id=actor;
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
      SELECT a.organizer_id,'event:'||event_id,event_kind,'Novo participante',COALESCE(actor_name,'Uma pessoa')||' entrou em '||left(a.title,100)||'.','/agendamentos'
      WHERE EXISTS(SELECT 1 FROM auth.users WHERE id=a.organizer_id)
      ON CONFLICT(recipient_id,event_key) DO NOTHING;
  ELSIF event_kind='appointment.canceled' AND a.status='canceled' THEN
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
      SELECT p.user_id,'event:'||event_id,event_kind,'Agendamento cancelado',left(a.title,100)||' foi cancelado.','/agendamentos'
      FROM public.user_appointment p JOIN auth.users u ON u.id=p.user_id
      WHERE p.appointment_id=a.id AND p.user_id<>a.organizer_id
      ON CONFLICT(recipient_id,event_key) DO NOTHING;
  END IF;
END $$;
REVOKE ALL ON FUNCTION notification_private.project_appointment(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
