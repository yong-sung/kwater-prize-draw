begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.ok(
  to_regtype('public.event_status') is not null,
  '행사 상태 enum이 존재한다'
);
select extensions.ok(
  to_regtype('public.prize_code') is not null,
  '경품 코드 enum이 존재한다'
);

select extensions.ok(c.relrowsecurity, format('%I 테이블에 RLS가 활성화된다', c.relname))
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any(array[
    'events', 'prizes', 'participants', 'draw_results',
    'reveal_state', 'audit_logs', 'admin_login_attempts'
  ]);

select extensions.ok(
  not pg_catalog.has_table_privilege(role_name, 'public.' || table_name, privilege_name),
  format('%s 역할은 public.%I %s 권한이 없다', role_name, table_name, privilege_name)
)
from unnest(array['anon', 'authenticated']) as roles(role_name)
cross join unnest(array[
  'events', 'prizes', 'participants', 'draw_results',
  'reveal_state', 'audit_logs', 'admin_login_attempts'
]) as tables(table_name)
cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as privileges(privilege_name);

select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) as acl
    where n.nspname = 'public'
      and p.proname = any(array[
        'execute_draw', 'draw_replacement', 'reveal_next', 'reveal_next_in_group',
        'publish_results', 'purge_expired_events', 'record_admin_login_failure'
      ])
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  0::bigint,
  'PUBLIC의 보안 함수 실행 권한이 회수된다'
);

select extensions.ok(
  not pg_catalog.has_function_privilege('anon', function_name, 'EXECUTE'),
  format('anon 역할은 %s 실행 권한이 없다', function_name)
)
from unnest(array[
  'public.execute_draw(uuid)',
  'public.draw_replacement(uuid,uuid,text)',
  'public.reveal_next(uuid)',
  'public.reveal_next_in_group(uuid,public.prize_code)',
  'public.publish_results(uuid)',
  'public.purge_expired_events()',
  'public.record_admin_login_failure(text,timestamp with time zone)'
]) as functions(function_name);

select extensions.ok(
  not pg_catalog.has_function_privilege('authenticated', function_name, 'EXECUTE'),
  format('authenticated 역할은 %s 실행 권한이 없다', function_name)
)
from unnest(array[
  'public.execute_draw(uuid)',
  'public.draw_replacement(uuid,uuid,text)',
  'public.reveal_next(uuid)',
  'public.reveal_next_in_group(uuid,public.prize_code)',
  'public.publish_results(uuid)',
  'public.purge_expired_events()',
  'public.record_admin_login_failure(text,timestamp with time zone)'
]) as functions(function_name);

set local role anon;
select extensions.throws_ok(
  $$select * from public.events limit 1$$,
  '42501',
  'permission denied for table events',
  'anon 역할의 실제 행사 테이블 조회가 거부된다'
);
select extensions.throws_ok(
  $$select public.execute_draw('00000000-0000-0000-0000-000000000000')$$,
  '42501',
  'permission denied for function execute_draw',
  'anon 역할의 실제 추첨 함수 호출이 거부된다'
);
reset role;

set local role authenticated;
select extensions.throws_ok(
  $$select * from public.events limit 1$$,
  '42501',
  'permission denied for table events',
  'authenticated 역할의 실제 행사 테이블 조회가 거부된다'
);
select extensions.throws_ok(
  $$select public.execute_draw('00000000-0000-0000-0000-000000000000')$$,
  '42501',
  'permission denied for function execute_draw',
  'authenticated 역할의 실제 추첨 함수 호출이 거부된다'
);
reset role;

select extensions.ok(
  pg_catalog.has_function_privilege('service_role', function_name, 'EXECUTE'),
  format('service_role 역할은 %s 실행 권한이 있다', function_name)
)
from unnest(array[
  'public.execute_draw(uuid)',
  'public.draw_replacement(uuid,uuid,text)',
  'public.reveal_next(uuid)',
  'public.reveal_next_in_group(uuid,public.prize_code)',
  'public.publish_results(uuid)',
  'public.purge_expired_events()',
  'public.record_admin_login_failure(text,timestamp with time zone)'
]) as functions(function_name);

select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and indexname = any(array[
        'prizes_event_id_idx',
        'participants_event_id_idx',
        'draw_results_event_id_idx',
        'draw_results_participant_id_idx',
        'draw_results_prize_id_idx',
        'audit_logs_event_id_idx'
      ])
  ),
  6::bigint,
  '외래키 조회 인덱스가 모두 존재한다'
);

insert into public.events(id, title, status)
values ('00000000-0000-0000-0000-000000000035', '35명 더미 행사', 'CLOSED');

select extensions.throws_ok(
  $$insert into public.events(id, title) values ('00000000-0000-0000-0000-000000000099', '중복 운영 행사')$$,
  '23505',
  'duplicate key value violates unique constraint "only_one_live_event"',
  '동시에 운영 가능한 미삭제 행사는 하나뿐이다'
);

insert into public.prizes(event_id, code, name, quantity, reveal_order)
values
  ('00000000-0000-0000-0000-000000000035', 'SCANNER', '더미 스캔기기', 15, 1),
  ('00000000-0000-0000-0000-000000000035', 'TUMBLER', '더미 텀블러', 15, 2),
  ('00000000-0000-0000-0000-000000000035', 'KEYBOARD', '더미 키보드', 15, 3);

insert into public.participants(
  event_id,
  name_ciphertext,
  phone_ciphertext,
  department_ciphertext,
  phone_hash,
  access_token_hash,
  consented_at
)
select
  '00000000-0000-0000-0000-000000000035',
  'dummy-name-ciphertext-' || value,
  'dummy-phone-ciphertext-' || value,
  'dummy-department-ciphertext-' || value,
  encode(extensions.digest('dummy-phone-' || value, 'sha256'), 'hex'),
  encode(extensions.digest('dummy-token-' || value, 'sha256'), 'hex'),
  statement_timestamp()
from generate_series(1, 46) as series(value);

select extensions.throws_ok(
  $$insert into public.participants(
      event_id, name_ciphertext, phone_ciphertext, department_ciphertext,
      phone_hash, access_token_hash, consented_at
    )
    select event_id, 'dummy', 'dummy', 'dummy', phone_hash,
      repeat('f', 64), statement_timestamp()
    from public.participants limit 1$$,
  '23505',
  'duplicate key value violates unique constraint "participants_event_phone_hash_key"',
  '같은 행사에서 동일 연락처 해시 중복 응모를 거부한다'
);

select extensions.is(
  public.execute_draw('00000000-0000-0000-0000-000000000035'),
  45,
  '46명과 경품 45개일 때 정확히 45명이 당첨된다'
);
select extensions.is(
  (
    select count(distinct participant_id)
    from public.draw_results
    where event_id = '00000000-0000-0000-0000-000000000035'
  ),
  45::bigint,
  '모든 당첨자는 중복되지 않는다'
);
select extensions.ok(
  not exists (
    select 1
    from public.draw_results as dr
    join public.prizes as p on p.id = dr.prize_id
    where dr.event_id = '00000000-0000-0000-0000-000000000035'
    group by p.id, p.quantity
    having count(*) > p.quantity
  ),
  '경품별 설정 수량을 초과하지 않는다'
);

create temporary table draw_snapshot as
select string_agg(
  id::text || ':' || participant_id::text || ':' || prize_id::text || ':' || reveal_position::text,
  ',' order by id
) as value
from public.draw_results
where event_id = '00000000-0000-0000-0000-000000000035';

select extensions.is(
  public.execute_draw('00000000-0000-0000-0000-000000000035'),
  45,
  '추첨 재호출은 기존 당첨 수를 반환한다'
);
select extensions.is(
  (
    select string_agg(
      id::text || ':' || participant_id::text || ':' || prize_id::text || ':' || reveal_position::text,
      ',' order by id
    )
    from public.draw_results
    where event_id = '00000000-0000-0000-0000-000000000035'
  ),
  (select value from draw_snapshot),
  '추첨 재호출은 기존 결과를 변경하지 않는다'
);

select extensions.throws_ok(
  $$insert into public.draw_results(event_id, participant_id, prize_id, reveal_position)
    select event_id, participant_id,
      (select id from public.prizes where event_id = dr.event_id and id <> dr.prize_id limit 1),
      999
    from public.draw_results as dr
    where event_id = '00000000-0000-0000-0000-000000000035'
    limit 1$$,
  '23505',
  'duplicate key value violates unique constraint "draw_results_event_participant_key"',
  '동일 참석자의 중복 당첨을 거부한다'
);

create temporary table replacement_target as
select id, participant_id, prize_id, reveal_position
from public.draw_results
where event_id = '00000000-0000-0000-0000-000000000035'
order by id
limit 1;

create temporary table replacement_others as
select string_agg(
  id::text || ':' || participant_id::text,
  ',' order by id
) as value
from public.draw_results
where event_id = '00000000-0000-0000-0000-000000000035'
  and id <> (select id from replacement_target);

select extensions.lives_ok(
  $$select public.draw_replacement(
      '00000000-0000-0000-0000-000000000035',
      (select id from replacement_target),
      '더미 제외 사유'
    )$$,
  '대체 당첨을 실행한다'
);
select extensions.ok(
  (
    select dr.participant_id <> target.participant_id
      and dr.prize_id = target.prize_id
      and dr.reveal_position = target.reveal_position
    from public.draw_results as dr
    cross join replacement_target as target
    where dr.id = target.id
  ),
  '대체 당첨자는 바뀌고 경품과 공개 위치는 유지된다'
);
select extensions.ok(
  (select disqualified_at is not null from public.participants where id = (select participant_id from replacement_target)),
  '대체 대상자는 이후 추첨에서 제외된다'
);
select extensions.is(
  (
    select string_agg(id::text || ':' || participant_id::text, ',' order by id)
    from public.draw_results
    where event_id = '00000000-0000-0000-0000-000000000035'
      and id <> (select id from replacement_target)
  ),
  (select value from replacement_others),
  '다른 기존 당첨자는 변경되지 않는다'
);

update public.events
set status = 'PURGED', updated_at = statement_timestamp()
where id = '00000000-0000-0000-0000-000000000035';

insert into public.events(id, title, status)
values ('00000000-0000-0000-0000-000000000001', '후보 없음 더미 행사', 'CLOSED');
insert into public.prizes(event_id, code, name, quantity, reveal_order)
values ('00000000-0000-0000-0000-000000000001', 'SCANNER', '더미 스캔기기', 1, 1);
insert into public.participants(
  event_id, name_ciphertext, phone_ciphertext, department_ciphertext,
  phone_hash, access_token_hash, consented_at
)
values (
  '00000000-0000-0000-0000-000000000001', 'dummy-name', 'dummy-phone', 'dummy-department',
  repeat('1', 64), repeat('2', 64), statement_timestamp()
);
select public.execute_draw('00000000-0000-0000-0000-000000000001');
select public.reveal_next('00000000-0000-0000-0000-000000000001');
select public.draw_replacement(
  '00000000-0000-0000-0000-000000000001',
  (select id from public.draw_results where event_id = '00000000-0000-0000-0000-000000000001'),
  '후보 없음 더미 사유'
);
select extensions.ok(
  (
    select participant_id is null and unawarded_at is not null
    from public.draw_results
    where event_id = '00000000-0000-0000-0000-000000000001'
  ),
  '대체 후보가 없으면 해당 슬롯을 미추첨 처리한다'
);
select extensions.is(
  (
    select revealed_count
    from public.reveal_state
    where event_id = '00000000-0000-0000-0000-000000000001'
  ),
  0,
  '공개된 슬롯을 미추첨 처리하면 공개 수가 감소한다'
);
select extensions.is(
  (
    select status::text
    from public.events
    where id = '00000000-0000-0000-0000-000000000001'
  ),
  'REVEALED',
  '공개된 슬롯을 미추첨 처리해도 더 공개할 당첨자가 없으면 공개 완료를 유지한다'
);

update public.events
set status = 'PURGED', updated_at = statement_timestamp()
where id = '00000000-0000-0000-0000-000000000001';

insert into public.events(id, title, status)
values ('00000000-0000-0000-0000-000000000020', '20명 더미 행사', 'CLOSED');
insert into public.prizes(event_id, code, name, quantity, reveal_order)
values
  ('00000000-0000-0000-0000-000000000020', 'SCANNER', '더미 스캔기기', 15, 1),
  ('00000000-0000-0000-0000-000000000020', 'TUMBLER', '더미 텀블러', 15, 2),
  ('00000000-0000-0000-0000-000000000020', 'KEYBOARD', '더미 키보드', 15, 3);
insert into public.participants(
  event_id, name_ciphertext, phone_ciphertext, department_ciphertext,
  phone_hash, access_token_hash, consented_at
)
select
  '00000000-0000-0000-0000-000000000020',
  'dummy-name-' || value, 'dummy-phone-' || value, 'dummy-department-' || value,
  encode(extensions.digest('twenty-phone-' || value, 'sha256'), 'hex'),
  encode(extensions.digest('twenty-token-' || value, 'sha256'), 'hex'),
  statement_timestamp()
from generate_series(1, 20) as series(value);
select extensions.is(
  public.execute_draw('00000000-0000-0000-0000-000000000020'),
  20,
  '20명과 경품 45개일 때 정확히 20명이 당첨된다'
);

update public.events
set status = 'PURGED', updated_at = statement_timestamp()
where id = '00000000-0000-0000-0000-000000000020';

insert into public.events(id, title, status)
values
  ('00000000-0000-0000-0000-000000000071', '교차 행사 A', 'PURGED'),
  ('00000000-0000-0000-0000-000000000072', '교차 행사 B', 'PURGED');
insert into public.prizes(id, event_id, code, name, quantity, reveal_order)
values
  ('00000000-0000-0000-0000-000000000171', '00000000-0000-0000-0000-000000000071', 'SCANNER', '더미 A 경품', 1, 1),
  ('00000000-0000-0000-0000-000000000172', '00000000-0000-0000-0000-000000000072', 'SCANNER', '더미 B 경품', 1, 1);
insert into public.participants(
  id, event_id, name_ciphertext, phone_ciphertext, department_ciphertext,
  phone_hash, access_token_hash, consented_at
)
values
  (
    '00000000-0000-0000-0000-000000000271', '00000000-0000-0000-0000-000000000071',
    'dummy-a-name', 'dummy-a-phone', 'dummy-a-department',
    repeat('7', 64), repeat('8', 64), statement_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000272', '00000000-0000-0000-0000-000000000072',
    'dummy-b-name', 'dummy-b-phone', 'dummy-b-department',
    repeat('9', 64), repeat('a', 64), statement_timestamp()
  );
select extensions.throws_ok(
  $$insert into public.draw_results(event_id, participant_id, prize_id, reveal_position)
    values (
      '00000000-0000-0000-0000-000000000071',
      '00000000-0000-0000-0000-000000000272',
      '00000000-0000-0000-0000-000000000171',
      1
    )$$,
  '23503',
  'insert or update on table "draw_results" violates foreign key constraint "draw_results_event_participant_fkey"',
  '다른 행사의 참석자를 추첨 결과에 연결할 수 없다'
);
select extensions.throws_ok(
  $$insert into public.draw_results(event_id, participant_id, prize_id, reveal_position)
    values (
      '00000000-0000-0000-0000-000000000071',
      '00000000-0000-0000-0000-000000000271',
      '00000000-0000-0000-0000-000000000172',
      1
    )$$,
  '23503',
  'insert or update on table "draw_results" violates foreign key constraint "draw_results_event_prize_fkey"',
  '다른 행사의 경품을 추첨 결과에 연결할 수 없다'
);

insert into public.events(id, title, status)
values ('00000000-0000-0000-0000-000000000002', '잘못된 상태 더미 행사', 'SETUP');
select extensions.throws_ok(
  $$select public.execute_draw('00000000-0000-0000-0000-000000000002')$$,
  'P0001',
  'EVENT_NOT_CLOSED',
  '허용되지 않은 행사 상태에서 추첨을 거부한다'
);
update public.events
set status = 'PURGED', updated_at = statement_timestamp()
where id = '00000000-0000-0000-0000-000000000002';

insert into public.events(id, title, status)
values ('00000000-0000-0000-0000-000000000003', '공개 더미 행사', 'CLOSED');
insert into public.prizes(event_id, code, name, quantity, reveal_order)
values
  ('00000000-0000-0000-0000-000000000003', 'SCANNER', '더미 스캔기기', 1, 1),
  ('00000000-0000-0000-0000-000000000003', 'TUMBLER', '더미 텀블러', 1, 2),
  ('00000000-0000-0000-0000-000000000003', 'KEYBOARD', '더미 키보드', 1, 3);
insert into public.participants(
  event_id, name_ciphertext, phone_ciphertext, department_ciphertext,
  phone_hash, access_token_hash, consented_at
)
select
  '00000000-0000-0000-0000-000000000003',
  'reveal-name-' || value, 'reveal-phone-' || value, 'reveal-department-' || value,
  encode(extensions.digest('reveal-phone-' || value, 'sha256'), 'hex'),
  encode(extensions.digest('reveal-token-' || value, 'sha256'), 'hex'),
  statement_timestamp()
from generate_series(1, 3) as series(value);
select public.execute_draw('00000000-0000-0000-0000-000000000003');

select extensions.throws_ok(
  $$select public.publish_results('00000000-0000-0000-0000-000000000003')$$,
  'P0001',
  'REVEAL_NOT_COMPLETE',
  '모든 공개 전에는 결과 공유를 거부한다'
);

create temporary table reveal_calls(sequence integer primary key, payload jsonb);
insert into reveal_calls values
  (1, public.reveal_next('00000000-0000-0000-0000-000000000003')),
  (2, public.reveal_next('00000000-0000-0000-0000-000000000003')),
  (3, public.reveal_next('00000000-0000-0000-0000-000000000003'));

select extensions.results_eq(
  $$select p.code::text
      from reveal_calls as calls
      join public.draw_results as dr on dr.id = (calls.payload ->> 'resultId')::uuid
      join public.prizes as p on p.id = dr.prize_id
     order by calls.sequence$$,
  $$values ('SCANNER'::text), ('TUMBLER'::text), ('KEYBOARD'::text)$$,
  '스캔기기, 텀블러, 키보드 순서로 공개한다'
);
select extensions.is(
  (select count(distinct payload ->> 'resultId') from reveal_calls),
  3::bigint,
  'reveal_next 호출마다 최대 한 명만 공개한다'
);
select extensions.is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-000000000003'),
  'REVEALED',
  '마지막 당첨자 공개 후 행사를 공개 완료로 전환한다'
);

select public.publish_results('00000000-0000-0000-0000-000000000003');
select extensions.is(
  (
    select purge_at - published_at
    from public.events
    where id = '00000000-0000-0000-0000-000000000003'
  ),
  interval '7 days',
  '결과 공유 시 정확히 7일 뒤 삭제시각을 설정한다'
);

select public.purge_expired_events();
select extensions.is(
  (
    select count(*)
    from public.participants
    where event_id = '00000000-0000-0000-0000-000000000003'
  ),
  3::bigint,
  '삭제시각 전에는 개인정보를 삭제하지 않는다'
);

update public.events
set published_at = statement_timestamp() - interval '8 days',
    purge_at = statement_timestamp() - interval '1 day',
    updated_at = statement_timestamp()
where id = '00000000-0000-0000-0000-000000000003';

select public.purge_expired_events();
select extensions.is(
  (select status::text from public.events where id = '00000000-0000-0000-0000-000000000003'),
  'PURGED',
  '삭제시각 후 행사를 PURGED 상태로 전환한다'
);
select extensions.is(
  (
    select count(*)
    from public.participants
    where event_id = '00000000-0000-0000-0000-000000000003'
  ),
  0::bigint,
  '삭제시각 후 개인정보를 삭제한다'
);
select extensions.is(
  (
    select count(*)
    from public.draw_results
    where event_id = '00000000-0000-0000-0000-000000000003'
  ),
  0::bigint,
  '삭제시각 후 개인별 추첨 결과를 삭제한다'
);

select extensions.throws_ok(
  $$insert into public.audit_logs(event_id, action, detail)
    values (
      '00000000-0000-0000-0000-000000000003',
      'UNSAFE_TEST',
      '{"name":"dummy-personal-value"}'::jsonb
    )$$,
  '23514',
  'new row for relation "audit_logs" violates check constraint "audit_logs_detail_check"',
  '감사 로그는 개인정보 필드를 거부한다'
);
select extensions.ok(
  not exists (
    select 1
    from public.audit_logs
    where detail::text like '%dummy-name%'
       or detail::text like '%dummy-phone%'
       or detail::text like '%dummy-department%'
  ),
  '감사 로그에 개인정보 원문이나 암호문을 남기지 않는다'
);

-- 기본 경품 15개씩(총 45개)과 응모 규모별 상한을 검증한다.
create temporary table quantity_contract_events (
  event_id uuid primary key,
  participant_count integer not null,
  expected_winners integer not null
);

insert into quantity_contract_events(event_id, participant_count, expected_winners)
values
  ('00000000-0000-0000-0000-000000000030', 30, 30),
  ('00000000-0000-0000-0000-000000000045', 45, 45),
  ('00000000-0000-0000-0000-000000000500', 500, 45);

create temporary table quantity_contract_results (
  event_id uuid primary key,
  expected_winners integer not null,
  winner_count integer not null
);

create temporary table quantity_contract_active_checks (
  event_id uuid primary key,
  active_event_count bigint not null
);
do $$
declare
  contract record;
begin
  for contract in select * from quantity_contract_events loop
    update public.events set status = 'PURGED', updated_at = statement_timestamp()
    where id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000035')
      and status <> 'PURGED';
    insert into public.events(id, title, status) values (contract.event_id, 'quantity-contract-' || contract.participant_count, 'CLOSED');
    insert into public.prizes(event_id, code, name, quantity, reveal_order) values
      (contract.event_id, 'SCANNER', 'contract scanner', 15, 1),
      (contract.event_id, 'TUMBLER', 'contract tumbler', 15, 2),
      (contract.event_id, 'KEYBOARD', 'contract keyboard', 15, 3);
    insert into public.participants(event_id, name_ciphertext, phone_ciphertext, department_ciphertext, phone_hash, access_token_hash, consented_at)
    select contract.event_id, 'contract-name-' || value, 'contract-phone-' || value, 'contract-department-' || value,
      encode(extensions.digest('contract-phone-hash-' || value || contract.event_id::text, 'sha256'), 'hex'),
      encode(extensions.digest('contract-token-' || value || contract.event_id::text, 'sha256'), 'hex'), statement_timestamp()
    from generate_series(1, contract.participant_count) as series(value);
    insert into quantity_contract_active_checks(event_id, active_event_count)
    select contract.event_id, count(*) from public.events where status <> 'PURGED';
    insert into quantity_contract_results(event_id, expected_winners, winner_count)
    values (contract.event_id, contract.expected_winners, public.execute_draw(contract.event_id));
    update public.events set status = 'PURGED', updated_at = statement_timestamp() where id = contract.event_id;
  end loop;
end $$;

select extensions.is(
  active_event_count,
  1::bigint,
  '수량 검증 fixture는 한 번에 하나의 활성 행사만 유지한다'
)
from quantity_contract_active_checks
order by event_id;

select extensions.is(
  winner_count,
  expected_winners,
  '30/45/500명 응모의 당첨 수가 경품 총량 상한과 일치한다'
)
from quantity_contract_results
order by event_id;

select extensions.is(
  (select sum(quantity) from public.prizes where prizes.event_id = results.event_id),
  45::bigint,
  '기본 총 경품 수는 45개다'
)
from quantity_contract_results as results
order by results.event_id;

select extensions.ok(
  not exists (
    select 1
    from public.draw_results as dr
    join public.prizes as p on p.id = dr.prize_id
    where dr.event_id = results.event_id
    group by p.id, p.quantity
    having count(*) > 15
  ),
  '경품별 당첨 수량은 15개를 넘지 않는다'
)
from quantity_contract_results as results
order by results.event_id;

select extensions.is(
  (
    select count(distinct participant_id)
    from public.draw_results
    where draw_results.event_id = results.event_id
  ),
  results.expected_winners::bigint,
  '참가자는 최대 1개 경품만 당첨된다'
)
from quantity_contract_results as results
order by results.event_id;

-- Preview 리허설 초기화는 설정을 보존하고 개인정보 연결 데이터를 원자 삭제한다.
update public.events set status='PURGED', updated_at=statement_timestamp() where status <> 'PURGED';
insert into public.events(id,title,description,venue,status) values('00000000-0000-0000-0000-000000000090','가짜 리허설','설명 보존','장소 보존','OPEN');
insert into public.prizes(id,event_id,code,name,quantity,reveal_order) values('00000000-0000-0000-0000-000000000190','00000000-0000-0000-0000-000000000090','SCANNER','보존 경품',1,1);
insert into public.participants(id,event_id,name_ciphertext,phone_ciphertext,department_ciphertext,phone_hash,access_token_hash,consented_at)
values('00000000-0000-0000-0000-000000000290','00000000-0000-0000-0000-000000000090','dummy-name','dummy-phone','dummy-dept',repeat('b',64),repeat('c',64),statement_timestamp());
insert into public.draw_results(event_id,participant_id,prize_id,reveal_position) values('00000000-0000-0000-0000-000000000090','00000000-0000-0000-0000-000000000290','00000000-0000-0000-0000-000000000190',1);
insert into public.reveal_state(event_id,revealed_count) values('00000000-0000-0000-0000-000000000090',1);
insert into public.audit_logs(event_id,action,reason,detail) values('00000000-0000-0000-0000-000000000090','OLD_ACTION','개인정보 가능 메모','{"note":"old"}');
select public.reset_rehearsal_event('00000000-0000-0000-0000-000000000090','가짜 리허설');

select extensions.is((select status::text from public.events where id='00000000-0000-0000-0000-000000000090'),'OPEN','초기화 후 즉시 응모 가능한 OPEN으로 복귀한다');
select extensions.is((select count(*) from public.participants where event_id='00000000-0000-0000-0000-000000000090'),0::bigint,'참석자 개인정보를 삭제한다');
select extensions.is((select count(*) from public.draw_results where event_id='00000000-0000-0000-0000-000000000090'),0::bigint,'추첨 결과를 삭제한다');
select extensions.is((select count(*) from public.reveal_state where event_id='00000000-0000-0000-0000-000000000090'),0::bigint,'공개 상태를 삭제한다');
select extensions.is((select count(*) from public.prizes where event_id='00000000-0000-0000-0000-000000000090'),1::bigint,'경품 설정을 보존한다');
select extensions.is((select count(*) from public.audit_logs where event_id='00000000-0000-0000-0000-000000000090' and action='REHEARSAL_RESET' and reason is null and detail='{}'::jsonb),1::bigint,'PII 없는 초기화 이력만 남긴다');
select extensions.ok(not (select prosecdef from pg_catalog.pg_proc where oid='public.reset_rehearsal_event(uuid,text)'::regprocedure),'초기화 함수는 SECURITY INVOKER다');
select extensions.ok(not pg_catalog.has_function_privilege('anon','public.reset_rehearsal_event(uuid,text)','EXECUTE') and not pg_catalog.has_function_privilege('authenticated','public.reset_rehearsal_event(uuid,text)','EXECUTE') and pg_catalog.has_function_privilege('service_role','public.reset_rehearsal_event(uuid,text)','EXECUTE'),'서버 역할만 초기화 함수를 실행한다');
select * from extensions.finish();
rollback;
