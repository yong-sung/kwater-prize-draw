create or replace function public.record_admin_login_failure(
  p_ip_hash text,
  p_now timestamptz default statement_timestamp()
)
returns table(blocked boolean, blocked_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempt public.admin_login_attempts%rowtype;
  next_failures integer;
  next_blocked_until timestamptz;
begin
  if p_ip_hash is null or length(p_ip_hash) < 16 or length(p_ip_hash) > 128 then
    raise exception 'invalid login identifier' using errcode = '22023';
  end if;

  insert into public.admin_login_attempts(ip_hash, failures, created_at, updated_at)
  values (p_ip_hash, 0, p_now, p_now)
  on conflict (ip_hash) do nothing;

  select * into current_attempt
  from public.admin_login_attempts
  where ip_hash = p_ip_hash
  for update;

  if current_attempt.blocked_until is not null and current_attempt.blocked_until > p_now then
    return query select true, current_attempt.blocked_until;
    return;
  end if;

  if p_now - current_attempt.created_at >= interval '10 minutes' then
    next_failures := 1;
    current_attempt.created_at := p_now;
  else
    next_failures := current_attempt.failures + 1;
  end if;
  next_blocked_until := case when next_failures >= 5 then p_now + interval '15 minutes' end;

  update public.admin_login_attempts
  set failures = next_failures,
      blocked_until = next_blocked_until,
      created_at = current_attempt.created_at,
      updated_at = p_now
  where ip_hash = p_ip_hash;

  return query select next_blocked_until is not null, next_blocked_until;
end;
$$;

revoke all on function public.record_admin_login_failure(text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_admin_login_failure(text, timestamptz) to service_role;
