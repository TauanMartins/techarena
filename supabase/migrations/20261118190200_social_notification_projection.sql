CREATE FUNCTION notification_private.project_friend(event_id uuid, event_kind text, payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f public.friend%ROWTYPE; actor uuid; recipient uuid; actor_name text;
BEGIN
  SELECT * INTO f FROM public.friend WHERE id=(payload->>'id')::bigint;
  IF NOT FOUND THEN RETURN; END IF;
  IF event_kind='friend.requested' AND f.status='pending' THEN actor:=f.requester_id; recipient:=f.addressee_id;
  ELSIF event_kind='friend.accepted' AND f.status='accepted' THEN actor:=f.addressee_id; recipient:=f.requester_id;
  ELSE RETURN; END IF;
  SELECT left(COALESCE(NULLIF(btrim(name),''),NULLIF(btrim(username),''),'Uma pessoa'),80) INTO actor_name FROM public.users WHERE id=actor;
  INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
    SELECT recipient,'event:'||event_id,event_kind,
      CASE event_kind WHEN 'friend.requested' THEN 'Solicitação de amizade' ELSE 'Amizade aceita' END,
      COALESCE(actor_name,'Uma pessoa')||CASE event_kind WHEN 'friend.requested' THEN ' quer se conectar com você.' ELSE ' aceitou sua solicitação de amizade.' END,
      '/social' WHERE recipient<>actor AND EXISTS(SELECT 1 FROM auth.users WHERE id=recipient)
    ON CONFLICT(recipient_id,event_key) DO NOTHING;
END $$;
CREATE FUNCTION notification_private.project_team(event_id uuid, event_kind text, payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.team_membership_request%ROWTYPE; team_name text; actor_name text;
BEGIN
  SELECT * INTO r FROM public.team_membership_request WHERE id=(payload->>'id')::bigint;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT left(name,100) INTO team_name FROM public.team WHERE id=r.team_id AND archived_at IS NULL;
  IF NOT FOUND THEN RETURN; END IF;
  IF (event_kind IN('team.invited','team.requested') AND r.status<>'pending') OR (event_kind='team.accepted' AND r.status<>'accepted') THEN RETURN; END IF;
  SELECT left(COALESCE(NULLIF(btrim(name),''),NULLIF(btrim(username),''),'Uma pessoa'),80) INTO actor_name FROM public.users WHERE id=r.user_id;
  IF event_kind='team.accepted' AND NOT EXISTS(SELECT 1 FROM public.user_team WHERE team_id=r.team_id AND user_id=r.user_id) THEN RETURN; END IF;
  IF event_kind IN('team.invited','team.requested') AND EXISTS(SELECT 1 FROM public.user_team WHERE team_id=r.team_id AND user_id=r.user_id) THEN RETURN; END IF;
  IF event_kind='team.invited' THEN
    -- An invitation from a former captain must not be delivered as actionable.
    IF NOT EXISTS(SELECT 1 FROM public.user_team WHERE team_id=r.team_id AND user_id=r.created_by AND role='captain') THEN RETURN; END IF;
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
      SELECT r.user_id,'event:'||event_id,event_kind,'Convite para equipe','Você foi convidado para '||team_name||'.','/equipes'
      WHERE r.user_id<>r.created_by AND EXISTS(SELECT 1 FROM auth.users WHERE id=r.user_id)
      ON CONFLICT(recipient_id,event_key) DO NOTHING;
  ELSIF event_kind='team.requested' OR (event_kind='team.accepted' AND r.kind='invitation') THEN
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
      SELECT m.user_id,'event:'||event_id,event_kind,
        CASE event_kind WHEN 'team.requested' THEN 'Solicitação para equipe' ELSE 'Convite aceito' END,
        COALESCE(actor_name,'Uma pessoa')||CASE event_kind WHEN 'team.requested' THEN ' quer participar de ' ELSE ' entrou em ' END||team_name||'.','/equipes'
      FROM public.user_team m JOIN auth.users u ON u.id=m.user_id
      WHERE m.team_id=r.team_id AND m.role='captain' AND m.user_id<>r.user_id
      ON CONFLICT(recipient_id,event_key) DO NOTHING;
  ELSE
    INSERT INTO public.notifications(recipient_id,event_key,kind,title,body,target_path)
      SELECT r.user_id,'event:'||event_id,event_kind,'Solicitação aceita','Você agora faz parte de '||team_name||'.','/equipes'
      WHERE EXISTS(SELECT 1 FROM auth.users WHERE id=r.user_id)
      ON CONFLICT(recipient_id,event_key) DO NOTHING;
  END IF;
END $$;
REVOKE ALL ON FUNCTION notification_private.project_friend(uuid,text,jsonb), notification_private.project_team(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
