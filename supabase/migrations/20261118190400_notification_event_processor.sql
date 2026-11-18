CREATE OR REPLACE FUNCTION public.process_notification_events(batch_size integer DEFAULT 100) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ev notification_private.events%ROWTYPE; processed integer := 0;
BEGIN
  IF batch_size NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid batch size'; END IF;
  FOR ev IN SELECT * FROM notification_private.events WHERE processed_at IS NULL AND attempts<10 AND available_at<=now()
    ORDER BY available_at,created_at LIMIT batch_size FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      IF ev.kind='chat.message' THEN PERFORM notification_private.project_chat(ev.id,ev.payload);
      ELSIF ev.kind IN('friend.requested','friend.accepted') THEN PERFORM notification_private.project_friend(ev.id,ev.kind,ev.payload);
      ELSIF ev.kind IN('team.invited','team.requested','team.accepted') THEN PERFORM notification_private.project_team(ev.id,ev.kind,ev.payload);
      ELSIF ev.kind IN('appointment.joined','appointment.canceled') THEN PERFORM notification_private.project_appointment(ev.id,ev.kind,ev.payload);
      ELSE RAISE EXCEPTION 'Unknown notification event' USING ERRCODE='22023'; END IF;
      UPDATE notification_private.events SET processed_at=now(),last_error_code=NULL WHERE id=ev.id;
      processed:=processed+1;
    EXCEPTION WHEN OTHERS THEN
      -- The subtransaction rolls back partial notifications, not the source business action.
      UPDATE notification_private.events SET attempts=attempts+1,last_error_code=SQLSTATE,
        available_at=now()+make_interval(secs=>LEAST(300,10*(2^LEAST(attempts,5))::integer)) WHERE id=ev.id;
    END;
  END LOOP;
  DELETE FROM notification_private.events WHERE id IN (
    SELECT id FROM notification_private.events WHERE processed_at < now()-interval '7 days' ORDER BY processed_at LIMIT 1000
  );
  RETURN processed;
END $$;
REVOKE ALL ON FUNCTION public.process_notification_events(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_notification_events(integer) TO service_role;
NOTIFY pgrst,'reload schema';
-- Cron activation is an explicit deployment step, see docs/NOTIFICATIONS.md.
