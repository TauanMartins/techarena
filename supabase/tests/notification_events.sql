-- Disposable database only, with backend + Supabase migrations applied. Fixtures roll back.
BEGIN;
CREATE FUNCTION pg_temp.assert_true(condition boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF condition IS DISTINCT FROM true THEN RAISE EXCEPTION '%',message; END IF; END $$;
INSERT INTO auth.users(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333'),('44444444-4444-4444-8444-444444444444');
INSERT INTO public.users(id,name) SELECT id,CASE left(id::text,1) WHEN '1' THEN 'Alice' WHEN '2' THEN 'Bob' WHEN '3' THEN 'Carol' ELSE 'Dora' END FROM auth.users;
INSERT INTO public.friend(id,requester_id,addressee_id,status) VALUES(10,'11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','pending');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.notifications),'Source operation must not render notifications synchronously');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='friend.requested' AND recipient_id='22222222-2222-4222-8222-222222222222'),'Friend request recipient');
UPDATE public.friend SET status='pending' WHERE id=10;
SELECT pg_temp.assert_true(public.process_notification_events()=0,'No notification for unchanged status');
UPDATE public.friend SET status='accepted' WHERE id=10;
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='friend.accepted' AND recipient_id='11111111-1111-4111-8111-111111111111'),'Accepted friendship recipient');
SAVEPOINT source_rollback;
INSERT INTO public.friend(requester_id,addressee_id,status) VALUES('22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','pending');
ROLLBACK TO source_rollback;
SELECT pg_temp.assert_true(public.process_notification_events()=0,'Rolled-back action must not publish');

INSERT INTO public.team(id,name) VALUES(11,'Equipe teste');
INSERT INTO public.user_team(team_id,user_id,role) VALUES(11,'11111111-1111-4111-8111-111111111111','captain');
INSERT INTO public.team_membership_request(id,team_id,user_id,created_by,kind,status) VALUES
 (12,11,'22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','invitation','pending'),
 (13,11,'33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333','request','pending');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='team.invited' AND recipient_id='22222222-2222-4222-8222-222222222222'),'Invite must notify invited user');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='team.requested' AND recipient_id='11111111-1111-4111-8111-111111111111'),'Request must notify captain');
INSERT INTO public.user_team(team_id,user_id,role) VALUES
 (11,'22222222-2222-4222-8222-222222222222','member'),(11,'33333333-3333-4333-8333-333333333333','member');
UPDATE public.team_membership_request SET status='accepted' WHERE id IN(12,13);
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.notifications WHERE kind='team.accepted' AND recipient_id IN('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333')),'Accepted team requests recipients');

INSERT INTO public.appointment(id,organizer_id,title,scheduled_at,status) VALUES(21,'11111111-1111-4111-8111-111111111111','Partida teste',now()+interval '1 day','scheduled');
INSERT INTO public.user_appointment(appointment_id,user_id) VALUES(21,'11111111-1111-4111-8111-111111111111');
SELECT pg_temp.assert_true(public.process_notification_events()=0,'Organizer must not receive own join');
INSERT INTO public.user_appointment(appointment_id,user_id) VALUES(21,'22222222-2222-4222-8222-222222222222');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='appointment.joined' AND recipient_id='11111111-1111-4111-8111-111111111111'),'Join must notify organizer');

INSERT INTO public.chat_conversations(topic,kind) VALUES
 ('direct:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222','direct'),('team:11','team'),('appointment:21','appointment');
INSERT INTO public.chat_participants(topic,user_id,display_name) SELECT topic,'11111111-1111-4111-8111-111111111111','Alice' FROM public.chat_conversations;
INSERT INTO public.chat_messages(id,topic,sender_id,body) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','direct:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Olá');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='chat.message' AND recipient_id='22222222-2222-4222-8222-222222222222' AND target_path='/chat/direct/11111111-1111-4111-8111-111111111111'),'First message reaches friend who never opened conversation');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.notifications WHERE kind='chat.message' AND recipient_id='11111111-1111-4111-8111-111111111111'),'No self notification');
INSERT INTO public.chat_messages(topic,sender_id,body) VALUES('team:11','11111111-1111-4111-8111-111111111111','Equipe');
DELETE FROM public.user_team WHERE team_id=11 AND user_id='33333333-3333-4333-8333-333333333333';
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='chat.message' AND target_path='/chat/team/11'),'Removed member excluded at delivery time');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.notifications WHERE recipient_id='44444444-4444-4444-8444-444444444444'),'Outsider never notified');
INSERT INTO public.chat_messages(topic,sender_id,body) VALUES('appointment:21','11111111-1111-4111-8111-111111111111','Evento');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE target_path='/chat/appointment/21'),'Appointment chat recipient');
INSERT INTO public.chat_messages(topic,sender_id,body) VALUES('direct:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Pendente');
UPDATE public.friend SET status='blocked' WHERE id=10;
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE target_path='/chat/direct/11111111-1111-4111-8111-111111111111'),'Blocked friendship suppresses pending delivery');

-- A rendering failure leaves the already-saved message intact and is retried idempotently.
CREATE FUNCTION pg_temp.fail_chat_notice() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='chat.message' THEN RAISE EXCEPTION 'Simulated renderer failure'; END IF; RETURN NEW; END $$;
CREATE TRIGGER simulated_failure BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_chat_notice();
INSERT INTO public.chat_messages(id,topic,sender_id,body) VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','team:11','11111111-1111-4111-8111-111111111111','Retry');
SELECT public.process_notification_events();
SELECT pg_temp.assert_true(EXISTS(SELECT 1 FROM public.chat_messages WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'),'Delivery failure must not remove the source message');
SELECT pg_temp.assert_true(EXISTS(SELECT 1 FROM notification_private.events WHERE payload->>'id'='cccccccc-cccc-4ccc-8ccc-cccccccccccc' AND attempts=1 AND processed_at IS NULL AND last_error_code IS NOT NULL),'Retry metadata missing');
DROP TRIGGER simulated_failure ON public.notifications;
UPDATE notification_private.events SET available_at=now() WHERE processed_at IS NULL;
SELECT public.process_notification_events();
UPDATE notification_private.events SET processed_at=NULL WHERE payload->>'id'='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.notifications WHERE target_path='/chat/team/11'),'Replay must not duplicate notification');

UPDATE public.appointment SET status='canceled' WHERE id=21;
SELECT public.process_notification_events();
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.notifications WHERE kind='appointment.canceled' AND recipient_id='22222222-2222-4222-8222-222222222222'),'Cancellation must notify participant only');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
SELECT public.mark_chat_notifications_read('/chat/team/11');
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.notifications WHERE target_path='/chat/team/11' AND read_at IS NULL) THEN RAISE EXCEPTION 'Visible chat acknowledgment failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE kind='friend.requested' AND read_at IS NULL) THEN RAISE EXCEPTION 'Other notices must remain unread'; END IF;
  BEGIN PERFORM public.process_notification_events(); RAISE EXCEPTION 'Browser can process events'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM notification_private.events; RAISE EXCEPTION 'Browser can read private queue'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
