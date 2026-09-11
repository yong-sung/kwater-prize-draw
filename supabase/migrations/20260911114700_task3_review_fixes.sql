alter table public.participants
  add constraint participants_event_id_id_key unique (event_id, id);

alter table public.prizes
  add constraint prizes_event_id_id_key unique (event_id, id);

alter table public.draw_results
  add constraint draw_results_event_participant_fkey
  foreign key (event_id, participant_id)
  references public.participants(event_id, id);

alter table public.draw_results
  add constraint draw_results_event_prize_fkey
  foreign key (event_id, prize_id)
  references public.prizes(event_id, id);
create or replace function public.draw_replacement(
  p_event_id uuid,
  p_result_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_removed_participant_id uuid;
  v_replacement_participant_id uuid;
  v_was_revealed boolean;
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
  if v_status not in ('DRAWN', 'REVEALING', 'REVEALED') then
    raise exception 'REPLACEMENT_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'INVALID_REPLACEMENT_REASON' using errcode = 'P0001';
  end if;

  select dr.participant_id, dr.revealed_at is not null
    into v_removed_participant_id, v_was_revealed
    from public.draw_results as dr
   where dr.id = p_result_id
     and dr.event_id = p_event_id
     and dr.participant_id is not null
     and dr.unawarded_at is null
   for update;

  if not found then
    raise exception 'DRAW_RESULT_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.participants
     set disqualified_at = statement_timestamp()
   where id = v_removed_participant_id;

  select p.id
    into v_replacement_participant_id
    from public.participants as p
   where p.event_id = p_event_id
     and p.disqualified_at is null
     and p.id <> v_removed_participant_id
     and not exists (
       select 1
         from public.draw_results as existing
        where existing.event_id = p_event_id
          and existing.participant_id = p.id
          and existing.unawarded_at is null
     )
   order by extensions.gen_random_uuid()
   limit 1
   for update skip locked;

  if v_replacement_participant_id is null then
    update public.draw_results
       set participant_id = null,
           revealed_at = null,
           replaced_at = statement_timestamp(),
           unawarded_at = statement_timestamp(),
           replacement_reason = btrim(p_reason)
     where id = p_result_id;
  else
    update public.draw_results
       set participant_id = v_replacement_participant_id,
           revealed_at = null,
           replaced_at = statement_timestamp(),
           unawarded_at = null,
           replacement_reason = btrim(p_reason)
     where id = p_result_id;
  end if;

  if v_was_revealed then
    update public.reveal_state
       set revealed_count = greatest(revealed_count - 1, 0),
           updated_at = statement_timestamp()
     where event_id = p_event_id;
    update public.events
       set status = 'REVEALING', updated_at = statement_timestamp()
     where id = p_event_id;
  end if;

  insert into public.audit_logs(event_id, action, reason, detail)
  values (
    p_event_id,
    'DRAW_REPLACED',
    btrim(p_reason),
    jsonb_build_object(
      'resultId', p_result_id,
      'removedParticipantId', v_removed_participant_id,
      'replacementParticipantId', v_replacement_participant_id
    )
  );

  return jsonb_build_object(
    'resultId', p_result_id,
    'removedParticipantId', v_removed_participant_id,
    'replacementParticipantId', v_replacement_participant_id
  );
end;
$$;

