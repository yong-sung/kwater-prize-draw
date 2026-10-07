-- SECURITY DEFINER is required because only the server-side service_role may
-- advance protected draw state. The function uses an empty search_path,
-- schema-qualified objects, explicit locking, and restricted EXECUTE grants.
create or replace function public.reveal_next_in_group(
  p_event_id uuid,
  p_expected_prize_code public.prize_code
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_result_id uuid;
  v_prize_code public.prize_code;
  v_remaining integer;
  v_next_status public.event_status;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_event_id::text, 0)
  );

  select e.status
    into v_status
    from public.events as e
   where e.id = p_event_id
   for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_status = 'REVEALED' then
    return jsonb_build_object(
      'status', 'REVEALED',
      'prizeCode', p_expected_prize_code,
      'resultId', null,
      'groupComplete', true
    );
  end if;
  if v_status not in ('DRAWN', 'REVEALING') then
    raise exception 'REVEAL_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select dr.id, p.code
    into v_result_id, v_prize_code
    from public.draw_results as dr
    join public.prizes as p on p.id = dr.prize_id
   where dr.event_id = p_event_id
     and dr.participant_id is not null
     and dr.unawarded_at is null
     and dr.revealed_at is null
   order by
     case p.code
       when 'KEYBOARD' then 1
       when 'TUMBLER' then 2
       when 'SCANNER' then 3
     end,
     dr.reveal_position,
     dr.id
   limit 1
   for update of dr skip locked;

  if v_result_id is null then
    update public.events
       set status = 'REVEALED', updated_at = statement_timestamp()
     where id = p_event_id;
    return jsonb_build_object(
      'status', 'REVEALED',
      'prizeCode', p_expected_prize_code,
      'resultId', null,
      'groupComplete', true
    );
  end if;

  if p_expected_prize_code is not null
     and v_prize_code <> p_expected_prize_code then
    return jsonb_build_object(
      'status', v_status,
      'prizeCode', p_expected_prize_code,
      'resultId', null,
      'groupComplete', true,
      'reason', 'GROUP_COMPLETE'
    );
  end if;

  update public.draw_results
     set revealed_at = statement_timestamp()
   where id = v_result_id
     and revealed_at is null;

  update public.reveal_state
     set revealed_count = revealed_count + 1,
         updated_at = statement_timestamp()
   where event_id = p_event_id;

  select count(*)::integer
    into v_remaining
    from public.draw_results as dr
   where dr.event_id = p_event_id
     and dr.participant_id is not null
     and dr.unawarded_at is null
     and dr.revealed_at is null;

  v_next_status :=
    case when v_remaining = 0 then 'REVEALED' else 'REVEALING' end;

  update public.events
     set status = v_next_status, updated_at = statement_timestamp()
   where id = p_event_id;

  insert into public.audit_logs(event_id, action, detail)
  values (
    p_event_id,
    'WINNER_REVEALED',
    jsonb_build_object(
      'resultId', v_result_id,
      'prizeCode', v_prize_code,
      'status', v_next_status
    )
  );

  return jsonb_build_object(
    'status', v_next_status,
    'prizeCode', v_prize_code,
    'resultId', v_result_id,
    'groupComplete', false
  );
end;
$$;

alter function public.reveal_next_in_group(uuid, public.prize_code)
  owner to postgres;

revoke all on function public.reveal_next_in_group(uuid, public.prize_code)
  from public, anon, authenticated;
grant execute on function public.reveal_next_in_group(uuid, public.prize_code)
  to service_role;