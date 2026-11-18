-- Run only against a disposable Supabase-compatible test database, after the migration.
-- Every assertion raises on failure; fixtures are rolled back.
BEGIN;
INSERT INTO auth.users(id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');
SET LOCAL ROLE service_role;
INSERT INTO public.notifications(id,recipient_id,event_key,kind,title,body,target_path) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','test:1','system.info','Um','Mensagem','/social'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','test:1','system.info','Dois','Mensagem',NULL);
INSERT INTO public.notifications(recipient_id,event_key,kind,title,body)
  VALUES('11111111-1111-4111-8111-111111111111','test:1','system.info','Duplicada','Não substituir')
  ON CONFLICT(recipient_id,event_key) DO NOTHING;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.notifications) <> 1 THEN RAISE EXCEPTION 'Recipient isolation failed'; END IF;
  IF (SELECT title FROM public.notifications) <> 'Um' THEN RAISE EXCEPTION 'Duplicate changed content'; END IF;
  IF public.mark_notifications_read('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> 0 THEN RAISE EXCEPTION 'Cross-user acknowledgment'; END IF;
  IF public.mark_notifications_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 1 THEN RAISE EXCEPTION 'Own acknowledgment failed'; END IF;
  IF public.mark_notifications_read(NULL) <> 0 THEN RAISE EXCEPTION 'Read acknowledgment is not idempotent'; END IF;
  BEGIN
    UPDATE public.notifications SET body='forged';
    RAISE EXCEPTION 'Client content update allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body)
      VALUES('11111111-1111-4111-8111-111111111111','forged','system.info','Forged','Forged');
    RAISE EXCEPTION 'Client insert allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.notifications WHERE read_at IS NULL) <> 1 THEN RAISE EXCEPTION 'Other account marked read'; END IF;
  IF public.mark_notifications_read(NULL) <> 1 THEN RAISE EXCEPTION 'Mark all failed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM * FROM public.notifications;
    RAISE EXCEPTION 'Anonymous reads allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.mark_notifications_read(NULL);
    RAISE EXCEPTION 'Anonymous acknowledgments allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
