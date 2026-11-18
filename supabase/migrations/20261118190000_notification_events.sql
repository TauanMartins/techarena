-- Requires the application tables and notification inbox in this same Supabase project.
-- Capturing an event is part of the source transaction; rendering notifications is asynchronous.
CREATE SCHEMA IF NOT EXISTS notification_private;
REVOKE ALL ON SCHEMA notification_private FROM PUBLIC, anon, authenticated;
CREATE TABLE notification_private.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  processed_at timestamptz,
  last_error_code text
);
ALTER TABLE notification_private.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON notification_private.events FROM PUBLIC, anon, authenticated;
CREATE INDEX notification_events_pending ON notification_private.events(available_at,created_at)
  WHERE processed_at IS NULL AND attempts < 10;

CREATE INDEX notification_events_done ON notification_private.events(processed_at) WHERE processed_at IS NOT NULL;

CREATE FUNCTION notification_private.capture_chat() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO notification_private.events(kind,payload) VALUES ('chat.message',jsonb_build_object('id',NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER capture_chat_notification AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION notification_private.capture_chat();

CREATE FUNCTION notification_private.capture_friend() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE event_kind text;
BEGIN
  IF TG_OP='INSERT' AND NEW.status='pending' THEN event_kind := 'friend.requested';
  ELSIF TG_OP='UPDATE' THEN
    IF OLD.status='pending' AND NEW.status='accepted' THEN event_kind := 'friend.accepted'; END IF;
  END IF;
  IF event_kind IS NOT NULL THEN
    INSERT INTO notification_private.events(kind,payload) VALUES(event_kind,jsonb_build_object('id',NEW.id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER capture_friend_notification AFTER INSERT OR UPDATE ON public.friend
  FOR EACH ROW EXECUTE FUNCTION notification_private.capture_friend();

CREATE FUNCTION notification_private.capture_team_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE event_kind text;
BEGIN
  IF TG_OP='INSERT' AND NEW.status='pending' THEN
    event_kind := CASE NEW.kind WHEN 'invitation' THEN 'team.invited' ELSE 'team.requested' END;
  ELSIF TG_OP='UPDATE' THEN
    IF OLD.status='pending' AND NEW.status='accepted' THEN event_kind := 'team.accepted'; END IF;
  END IF;
  IF event_kind IS NOT NULL THEN
    INSERT INTO notification_private.events(kind,payload) VALUES(event_kind,jsonb_build_object('id',NEW.id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER capture_team_notification AFTER INSERT OR UPDATE ON public.team_membership_request
  FOR EACH ROW EXECUTE FUNCTION notification_private.capture_team_request();

CREATE FUNCTION notification_private.capture_appointment_join() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  -- The organizer's initial registration is not a new guest.
  IF EXISTS (SELECT 1 FROM public.appointment WHERE id=NEW.appointment_id AND organizer_id<>NEW.user_id) THEN
    INSERT INTO notification_private.events(kind,payload) VALUES ('appointment.joined',jsonb_build_object('id',NEW.appointment_id,'user_id',NEW.user_id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER capture_appointment_join_notification AFTER INSERT ON public.user_appointment
  FOR EACH ROW EXECUTE FUNCTION notification_private.capture_appointment_join();

CREATE FUNCTION notification_private.capture_appointment_cancel() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status='canceled' THEN
    INSERT INTO notification_private.events(kind,payload) VALUES('appointment.canceled',jsonb_build_object('id',NEW.id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER capture_appointment_cancel_notification AFTER UPDATE ON public.appointment
  FOR EACH ROW EXECUTE FUNCTION notification_private.capture_appointment_cancel();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA notification_private FROM PUBLIC, anon, authenticated;
