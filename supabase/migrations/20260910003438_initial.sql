create extension if not exists pgcrypto with schema extensions;

create type public.event_status as enum (
  'SETUP',
  'OPEN',
  'CLOSED',
  'DRAWN',
  'REVEALING',
  'REVEALED',
  'PUBLISHED',
  'PURGED'
);

create type public.prize_code as enum ('SCANNER', 'TUMBLER', 'KEYBOARD');

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '',
  venue text not null default '',
  starts_at timestamptz,
  privacy_items text[] not null default array['이름', '연락처', '부서'],
  privacy_purpose text not null default '참석자 사전조회 및 이벤트 진행',
  retention_days integer not null default 7 check (retention_days = 7),
  status public.event_status not null default 'SETUP',
  published_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint events_publication_window_check check (
    (published_at is null and purge_at is null)
    or (
      published_at is not null
      and purge_at = published_at + interval '7 days'
    )
  ),
  constraint events_updated_at_check check (updated_at >= created_at)
);

create unique index only_one_live_event
  on public.events ((true))
  where status <> 'PURGED';

create table public.prizes (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code public.prize_code not null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  quantity integer not null check (quantity between 1 and 500),
  reveal_order integer not null check (reveal_order between 1 and 3),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint prizes_event_code_key unique (event_id, code),
  constraint prizes_event_reveal_order_key unique (event_id, reveal_order),
  constraint prizes_code_order_check check (
    (code = 'SCANNER' and reveal_order = 1)
    or (code = 'TUMBLER' and reveal_order = 2)
    or (code = 'KEYBOARD' and reveal_order = 3)
  ),
  constraint prizes_updated_at_check check (updated_at >= created_at)
);

create table public.participants (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name_ciphertext text not null check (char_length(name_ciphertext) > 0),
  phone_ciphertext text not null check (char_length(phone_ciphertext) > 0),
  department_ciphertext text not null check (char_length(department_ciphertext) > 0),
  phone_hash text not null check (char_length(phone_hash) >= 32),
  access_token_hash text not null unique check (char_length(access_token_hash) >= 32),
  consented_at timestamptz not null,
  disqualified_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  constraint participants_event_phone_hash_key unique (event_id, phone_hash)
);

create table public.draw_results (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete cascade,
  reveal_position integer not null check (reveal_position > 0),
  revealed_at timestamptz,
  replaced_at timestamptz,
  unawarded_at timestamptz,
  replacement_reason text check (
    replacement_reason is null
    or char_length(btrim(replacement_reason)) between 1 and 500
  ),
  created_at timestamptz not null default statement_timestamp(),
  constraint draw_results_event_participant_key unique (event_id, participant_id),
  constraint draw_results_prize_reveal_position_key unique (prize_id, reveal_position),
  constraint draw_results_award_state_check check (
    (participant_id is not null and unawarded_at is null)
    or (participant_id is null and unawarded_at is not null)
  )
);

create table public.reveal_state (
  event_id uuid primary key references public.events(id) on delete cascade,
  revealed_count integer not null default 0 check (revealed_count >= 0),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete cascade,
  action text not null check (char_length(btrim(action)) between 1 and 100),
  reason text check (reason is null or char_length(btrim(reason)) between 1 and 500),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  constraint audit_logs_detail_check check (
    jsonb_typeof(detail) = 'object'
    and not detail ?| array[
      'name',
      'phone',
      'department',
      'secret',
      'ciphertext',
      'accessToken'
    ]
  )
);

create table public.admin_login_attempts (
  ip_hash text primary key check (char_length(ip_hash) >= 32),
  failures integer not null default 0 check (failures >= 0),
  blocked_until timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint admin_login_attempts_updated_at_check check (updated_at >= created_at)
);

create index prizes_event_id_idx on public.prizes(event_id);
create index participants_event_id_idx on public.participants(event_id);
create index draw_results_event_id_idx on public.draw_results(event_id);
create index draw_results_participant_id_idx on public.draw_results(participant_id);
create index draw_results_prize_id_idx on public.draw_results(prize_id);
create index audit_logs_event_id_idx on public.audit_logs(event_id);

alter table public.events enable row level security;
alter table public.prizes enable row level security;
alter table public.participants enable row level security;
alter table public.draw_results enable row level security;
alter table public.reveal_state enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_login_attempts enable row level security;

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

create or replace function public.execute_draw(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_count integer;
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

  select count(*)::integer
    into v_count
    from public.draw_results as dr
   where dr.event_id = p_event_id;

  if v_count > 0 or v_status in ('DRAWN', 'REVEALING', 'REVEALED', 'PUBLISHED') then
    return v_count;
  end if;

  if v_status <> 'CLOSED' then
    raise exception 'EVENT_NOT_CLOSED' using errcode = 'P0001';
  end if;

  with shuffled_people as (
    select
      p.id,
      row_number() over (order by extensions.gen_random_uuid()) as slot_number
    from public.participants as p
    where p.event_id = p_event_id
      and p.disqualified_at is null
  ),
  shuffled_prize_slots as (
    select
      p.id as prize_id,
      row_number() over (order by extensions.gen_random_uuid()) as slot_number
    from public.prizes as p
    cross join lateral pg_catalog.generate_series(1, p.quantity)
    where p.event_id = p_event_id
  ),
  assigned as (
    select people.id as participant_id, slots.prize_id
    from shuffled_people as people
    join shuffled_prize_slots as slots using (slot_number)
  ),
  ranked as (
    select
      assigned.participant_id,
      assigned.prize_id,
      row_number() over (
        partition by assigned.prize_id
        order by extensions.gen_random_uuid()
      )::integer as reveal_position
    from assigned
  )
  insert into public.draw_results (
    event_id,
    participant_id,
    prize_id,
    reveal_position
  )
  select p_event_id, ranked.participant_id, ranked.prize_id, ranked.reveal_position
    from ranked;

  insert into public.reveal_state(event_id)
  values (p_event_id)
  on conflict (event_id) do nothing;

  update public.events
     set status = 'DRAWN', updated_at = statement_timestamp()
   where id = p_event_id;

  select count(*)::integer
    into v_count
    from public.draw_results as dr
   where dr.event_id = p_event_id;

  insert into public.audit_logs(event_id, action, detail)
  values (p_event_id, 'DRAW_EXECUTED', jsonb_build_object('count', v_count));

  return v_count;
end;
$$;

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

  if v_was_revealed and v_replacement_participant_id is not null then
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

create or replace function public.reveal_next(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_result_id uuid;
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
    return jsonb_build_object('status', 'REVEALED', 'resultId', null);
  end if;
  if v_status not in ('DRAWN', 'REVEALING') then
    raise exception 'REVEAL_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select dr.id
    into v_result_id
    from public.draw_results as dr
    join public.prizes as p on p.id = dr.prize_id
   where dr.event_id = p_event_id
     and dr.participant_id is not null
     and dr.unawarded_at is null
     and dr.revealed_at is null
   order by p.reveal_order, dr.reveal_position, dr.id
   limit 1
   for update of dr skip locked;

  if v_result_id is not null then
    update public.draw_results
       set revealed_at = statement_timestamp()
     where id = v_result_id;
    update public.reveal_state
       set revealed_count = revealed_count + 1,
           updated_at = statement_timestamp()
     where event_id = p_event_id;
  end if;

  select count(*)::integer
    into v_remaining
    from public.draw_results as dr
   where dr.event_id = p_event_id
     and dr.participant_id is not null
     and dr.unawarded_at is null
     and dr.revealed_at is null;

  v_next_status := case when v_remaining = 0 then 'REVEALED' else 'REVEALING' end;
  update public.events
     set status = v_next_status, updated_at = statement_timestamp()
   where id = p_event_id;

  insert into public.audit_logs(event_id, action, detail)
  values (
    p_event_id,
    case when v_result_id is null then 'REVEAL_COMPLETED' else 'WINNER_REVEALED' end,
    jsonb_build_object('resultId', v_result_id, 'status', v_next_status)
  );

  return jsonb_build_object('status', v_next_status, 'resultId', v_result_id);
end;
$$;

create or replace function public.publish_results(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.event_status;
  v_published_at timestamptz;
  v_purge_at timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_event_id::text, 0)
  );

  select e.status, e.published_at, e.purge_at
    into v_status, v_published_at, v_purge_at
    from public.events as e
   where e.id = p_event_id
   for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_status = 'PUBLISHED' then
    return jsonb_build_object('publishedAt', v_published_at, 'purgeAt', v_purge_at);
  end if;
  if v_status <> 'REVEALED' then
    raise exception 'REVEAL_NOT_COMPLETE' using errcode = 'P0001';
  end if;

  v_published_at := statement_timestamp();
  v_purge_at := v_published_at + interval '7 days';

  update public.events
     set status = 'PUBLISHED',
         published_at = v_published_at,
         purge_at = v_purge_at,
         updated_at = statement_timestamp()
   where id = p_event_id;

  insert into public.audit_logs(event_id, action, detail)
  values (
    p_event_id,
    'RESULTS_PUBLISHED',
    jsonb_build_object('publishedAt', v_published_at, 'purgeAt', v_purge_at)
  );

  return jsonb_build_object('publishedAt', v_published_at, 'purgeAt', v_purge_at);
end;
$$;

create or replace function public.purge_expired_events()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event record;
  v_purged_event_ids uuid[] := array[]::uuid[];
begin
  for v_event in
    select e.id
      from public.events as e
     where e.status = 'PUBLISHED'
       and e.purge_at <= statement_timestamp()
     order by e.purge_at
     for update skip locked
  loop
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(v_event.id::text, 0)
    );

    delete from public.participants where event_id = v_event.id;
    delete from public.reveal_state where event_id = v_event.id;

    update public.events
       set status = 'PURGED', updated_at = statement_timestamp()
     where id = v_event.id;

    insert into public.audit_logs(event_id, action)
    values (v_event.id, 'EVENT_PURGED');

    v_purged_event_ids := array_append(v_purged_event_ids, v_event.id);
  end loop;

  return jsonb_build_object('purgedEventIds', to_jsonb(v_purged_event_ids));
end;
$$;

revoke all on function public.execute_draw(uuid) from public, anon, authenticated;
revoke all on function public.draw_replacement(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reveal_next(uuid) from public, anon, authenticated;
revoke all on function public.publish_results(uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_events() from public, anon, authenticated;

grant execute on function public.execute_draw(uuid) to service_role;
grant execute on function public.draw_replacement(uuid, uuid, text) to service_role;
grant execute on function public.reveal_next(uuid) to service_role;
grant execute on function public.publish_results(uuid) to service_role;
grant execute on function public.purge_expired_events() to service_role;

do $$
declare
  v_table text;
  v_function text;
begin
  foreach v_table in array array[
    'events',
    'prizes',
    'participants',
    'draw_results',
    'reveal_state',
    'audit_logs',
    'admin_login_attempts'
  ]
  loop
    if not exists (
      select 1
        from pg_catalog.pg_class as c
        join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = v_table
         and c.relrowsecurity
    ) then
      raise exception 'RLS_NOT_ENABLED:%', v_table;
    end if;

    if pg_catalog.has_table_privilege('anon', 'public.' || v_table, 'SELECT')
      or pg_catalog.has_table_privilege('authenticated', 'public.' || v_table, 'SELECT')
    then
      raise exception 'DIRECT_TABLE_ACCESS_NOT_REVOKED:%', v_table;
    end if;
  end loop;

  foreach v_function in array array[
    'public.execute_draw(uuid)',
    'public.draw_replacement(uuid,uuid,text)',
    'public.reveal_next(uuid)',
    'public.publish_results(uuid)',
    'public.purge_expired_events()'
  ]
  loop
    if pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', v_function, 'EXECUTE')
    then
      raise exception 'PUBLIC_FUNCTION_ACCESS_NOT_REVOKED:%', v_function;
    end if;

    if not pg_catalog.has_function_privilege('service_role', v_function, 'EXECUTE') then
      raise exception 'SERVICE_ROLE_FUNCTION_ACCESS_MISSING:%', v_function;
    end if;
  end loop;
end;
$$;
