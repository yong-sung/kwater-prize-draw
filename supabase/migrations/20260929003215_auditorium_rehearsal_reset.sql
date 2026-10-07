create or replace function public.transition_event_status(
  p_event_id uuid,
  p_expected_status public.event_status,
  p_next_status public.event_status
)
returns public.event_status
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status public.event_status;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id::text, 0));
  select e.status into v_status from public.events e where e.id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_status <> p_expected_status then raise exception 'EVENT_STATUS_CHANGED' using errcode = 'P0001'; end if;
  if not ((v_status = 'SETUP' and p_next_status = 'OPEN') or (v_status = 'OPEN' and p_next_status = 'CLOSED') or (v_status = 'CLOSED' and p_next_status = 'OPEN')) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  update public.events set status = p_next_status, updated_at = statement_timestamp() where id = p_event_id returning status into v_status;
  return v_status;
end;
$$;

create or replace function public.register_participant(
  p_event_id uuid,
  p_name_ciphertext text,
  p_phone_ciphertext text,
  p_department_ciphertext text,
  p_phone_hash text,
  p_access_token_hash text,
  p_consented_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_id uuid;
  v_existing_token text;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id::text, 0));
  select e.status into v_status from public.events e where e.id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_status <> 'OPEN' then raise exception 'EVENT_CLOSED' using errcode = 'P0001'; end if;
  select p.id, p.access_token_hash into v_id, v_existing_token
    from public.participants p where p.event_id = p_event_id and p.phone_hash = p_phone_hash;
  if found then
    if v_existing_token = p_access_token_hash then return pg_catalog.jsonb_build_object('participantId', v_id, 'created', false); end if;
    raise exception 'DUPLICATE_PHONE' using errcode = 'P0001';
  end if;
  insert into public.participants(event_id,name_ciphertext,phone_ciphertext,department_ciphertext,phone_hash,access_token_hash,consented_at)
  values(p_event_id,p_name_ciphertext,p_phone_ciphertext,p_department_ciphertext,p_phone_hash,p_access_token_hash,p_consented_at)
  returning id into v_id;
  return pg_catalog.jsonb_build_object('participantId', v_id, 'created', true);
end;
$$;

create or replace function public.reset_rehearsal_event(p_event_id uuid, p_expected_title text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_title text;
  v_participants integer;
  v_results integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id::text, 0));
  select e.status, e.title into v_status, v_title from public.events e where e.id = p_event_id for update;
  if not found then raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001'; end if;
  if v_title <> p_expected_title then raise exception 'EVENT_TITLE_CHANGED' using errcode = 'P0001'; end if;
  if v_status = 'PURGED' then raise exception 'REHEARSAL_RESET_NOT_ALLOWED' using errcode = 'P0001'; end if;
  select count(*)::integer into v_results from public.draw_results dr where dr.event_id = p_event_id;
  select count(*)::integer into v_participants from public.participants p where p.event_id = p_event_id;
  delete from public.draw_results where event_id = p_event_id;
  delete from public.reveal_state where event_id = p_event_id;
  delete from public.participants where event_id = p_event_id;
  delete from public.audit_logs where event_id = p_event_id;
  update public.events set status='OPEN', published_at=null, purge_at=null, updated_at=statement_timestamp() where id=p_event_id;
  insert into public.audit_logs(event_id, action, reason, detail) values(p_event_id, 'REHEARSAL_RESET', null, '{}'::jsonb);
  return pg_catalog.jsonb_build_object('eventId', p_event_id, 'status', 'OPEN', 'participantsDeleted', v_participants, 'resultsDeleted', v_results);
end;
$$;

revoke all on function public.transition_event_status(uuid, public.event_status, public.event_status) from public, anon, authenticated;
revoke all on function public.register_participant(uuid,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.reset_rehearsal_event(uuid,text) from public, anon, authenticated;
grant execute on function public.transition_event_status(uuid, public.event_status, public.event_status) to service_role;
grant execute on function public.register_participant(uuid,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.reset_rehearsal_event(uuid,text) to service_role;
-- 행사별 변경은 모두 advisory lock을 먼저 획득한 뒤 행사 행을 잠근다.
-- 초기화와 만료 삭제가 서로 반대 순서로 잠금을 기다리는 교착을 방지한다.
create or replace function public.purge_expired_events()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate record;
  v_event record;
  v_purged_event_ids uuid[] := array[]::uuid[];
begin
  for v_candidate in
    select e.id
      from public.events as e
     where e.status = 'PUBLISHED'
       and e.purge_at <= statement_timestamp()
     order by e.purge_at
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_candidate.id::text, 0)
    );

    select e.id, e.status, e.purge_at
      into v_event
      from public.events as e
     where e.id = v_candidate.id
     for update;

    if not found
      or v_event.status <> 'PUBLISHED'
      or v_event.purge_at > statement_timestamp()
    then
      continue;
    end if;

    delete from public.participants where event_id = v_event.id;
    delete from public.reveal_state where event_id = v_event.id;

    update public.events
       set status = 'PURGED', updated_at = statement_timestamp()
     where id = v_event.id;

    insert into public.audit_logs(event_id, action)
    values (v_event.id, 'EVENT_PURGED');

    v_purged_event_ids := array_append(v_purged_event_ids, v_event.id);
  end loop;

  return pg_catalog.jsonb_build_object(
    'purgedEventIds',
    pg_catalog.to_jsonb(v_purged_event_ids)
  );
end;
$$;

revoke all on function public.purge_expired_events() from public, anon, authenticated;
grant execute on function public.purge_expired_events() to service_role;
