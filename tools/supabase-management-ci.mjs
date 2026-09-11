import {
  appendFileSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const API_ORIGIN = "https://api.supabase.com";
const EXPECTED_PROJECT_NAME = "kwater-prize-draw-dev";
const EXPECTED_ASSERTIONS = 116;
const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;
const MIGRATION_FILE_PATTERN = /^(\d{14})_([a-z0-9_]+)\.sql$/;
const KNOWN_REMOTE_VERSIONS = new Map([
  ["20260910003438_initial", "20260911021758"],
  ["20260911114700_task3_review_fixes", "20260911025534"],
]);

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`필수 환경변수 누락: ${name}`);
  return value;
}

function safeErrorCode(body) {
  if (!body || typeof body !== "object") return "unknown";
  for (const key of ["code", "error_code", "error"]) {
    const value = body[key];
    if (typeof value === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(value)) {
      return value;
    }
  }
  return "unknown";
}

async function managementRequest(projectRef, token, path, options = {}) {
  const response = await fetch(
    `${API_ORIGIN}/v1/projects/${projectRef}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    },
  );

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
  }
  if (!response.ok) {
    throw new Error(
      `Supabase Management API 실패: HTTP ${response.status}, code=${safeErrorCode(body)}`,
    );
  }
  return body;
}

function collectStrings(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
  return output;
}

function collectChecks(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectChecks(item, output);
  } else if (value && typeof value === "object") {
    if ("check_name" in value && "passed" in value) output.push(value);
    for (const item of Object.values(value)) collectChecks(item, output);
  }
  return output;
}

function assertPgTap(response) {
  const lines = collectStrings(response)
    .flatMap((value) => value.split(/\r?\n/))
    .map((value) => value.trim());
  const failures = lines.filter((line) => /^not ok\b/i.test(line));
  const successes = lines.filter((line) => /^ok\s+\d+\b/i.test(line));
  const planned = lines.some((line) => line === `1..${EXPECTED_ASSERTIONS}`);
  if (failures.length || successes.length !== EXPECTED_ASSERTIONS || !planned) {
    throw new Error(
      `원격 pgTAP 판정 실패: ok=${successes.length}, not_ok=${failures.length}, plan=${planned}`,
    );
  }
}

function buildRemotePgTap(source) {
  const withCollector = source.replace(
    /^begin;\s*/i,
    [
      "begin;",
      "create temp table pg_temp.tap_results(line text) on commit drop;",
      "grant insert, select on pg_temp.tap_results to anon, authenticated;",
      "",
    ].join("\n"),
  );
  const withAssertions = withCollector.replace(
    /^select extensions\.(ok|is|lives_ok|results_eq|throws_ok)\b/gm,
    "insert into pg_temp.tap_results(line) select extensions.$1",
  );
  const completed = withAssertions.replace(
    /^select \* from extensions\.finish\(\);\s*$/m,
    [
      "insert into pg_temp.tap_results(line) select * from extensions.finish();",
      "select line from pg_temp.tap_results;",
    ].join("\n"),
  );
  if (
    completed === source ||
    !completed.includes("select line from pg_temp.tap_results;")
  ) {
    throw new Error("원격 pgTAP 수집 SQL을 안전하게 구성하지 못했습니다.");
  }
  return completed;
}

function assertDatabaseChecks(response) {
  const checks = collectChecks(response);
  const failed = checks.filter((check) => check.passed !== true);
  if (checks.length !== 8 || failed.length) {
    const names = failed
      .map((check) => String(check.check_name))
      .filter((name) => /^[a-z0-9_]{1,80}$/.test(name))
      .join(",");
    throw new Error(
      `원격 DB 계약 검사 실패: count=${checks.length}, failed=${names || "unknown"}`,
    );
  }
}

function advisorFailures(response, type) {
  const lints = Array.isArray(response?.lints) ? response.lints : [];
  const blockingLevels =
    type === "security" ? new Set(["WARN", "ERROR"]) : new Set(["ERROR"]);
  const levels = lints.reduce((summary, lint) => {
    const level = String(lint?.level ?? "UNKNOWN").toUpperCase();
    summary[level] = (summary[level] ?? 0) + 1;
    return summary;
  }, {});
  return {
    total: lints.length,
    levels,
    blocking: lints.filter((lint) =>
      blockingLevels.has(String(lint?.level).toUpperCase()),
    ),
  };
}

function appendSummary(lines) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path) appendFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function normalizeSql(sql) {
  return sql
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;$/, "");
}

async function verifyMigrationDetails(
  projectRef,
  token,
  migration,
  expectedSql,
) {
  const details = await managementRequest(
    projectRef,
    token,
    `/database/migrations/${migration.version}`,
  );
  if (
    details?.version !== migration.version ||
    details?.name !== migration.name ||
    !Array.isArray(details?.statements) ||
    normalizeSql(details.statements.join(";\n")) !== normalizeSql(expectedSql)
  ) {
    throw new Error(`원격 migration 상세 SQL 계약 불일치: ${migration.name}`);
  }
}

const verificationSql = String.raw`
with
expected_tables(name) as (
  values ('events'), ('prizes'), ('participants'), ('draw_results'),
         ('reveal_state'), ('audit_logs'), ('admin_login_attempts')
),
expected_indexes(name) as (
  values ('only_one_live_event'), ('prizes_event_id_idx'),
         ('participants_event_id_idx'), ('draw_results_event_id_idx'),
         ('draw_results_participant_id_idx'), ('draw_results_prize_id_idx'),
         ('audit_logs_event_id_idx'), ('participants_event_id_id_key'),
         ('prizes_event_id_id_key')
),
expected_functions(signature) as (
  values ('execute_draw(uuid)'), ('draw_replacement(uuid,uuid,text)'),
         ('reveal_next(uuid)'), ('publish_results(uuid)'),
         ('purge_expired_events()')
)
select 'tables_exist' as check_name,
       (select count(*) = 7 from expected_tables e
        where to_regclass('public.' || e.name) is not null) as passed
union all
select 'constraints_valid',
       not exists (
         select 1 from pg_constraint c
         join pg_namespace n on n.oid = c.connamespace
         where n.nspname = 'public' and not c.convalidated
       )
union all
select 'indexes_exist',
       (select count(*) = 9 from expected_indexes e
        where to_regclass('public.' || e.name) is not null)
union all
select 'rls_enabled',
       (select count(*) = 7 from expected_tables e
        join pg_class c on c.oid = to_regclass('public.' || e.name)
        where c.relrowsecurity)
union all
select 'no_permissive_policies',
       not exists (select 1 from pg_policies where schemaname = 'public')
union all
select 'functions_hardened',
       (select count(*) = 5 from expected_functions e
        join pg_proc p on p.oid = to_regprocedure('public.' || e.signature)
        where p.prosecdef
          and exists (
            select 1 from unnest(coalesce(p.proconfig, array[]::text[])) setting
            where setting in ('search_path=', 'search_path=""')
          ))
union all
select 'anon_authenticated_table_denied',
       not exists (
         select 1 from expected_tables e
         cross join unnest(array['anon', 'authenticated']) role_name
         where has_table_privilege(role_name, 'public.' || e.name, 'SELECT')
            or has_table_privilege(role_name, 'public.' || e.name, 'INSERT')
            or has_table_privilege(role_name, 'public.' || e.name, 'UPDATE')
            or has_table_privilege(role_name, 'public.' || e.name, 'DELETE')
       )
union all
select 'anon_authenticated_function_denied',
       not exists (
         select 1 from expected_functions e
         cross join unnest(array['anon', 'authenticated']) role_name
         where has_function_privilege(role_name, 'public.' || e.signature, 'EXECUTE')
       );
`;

async function main() {
  const token = requiredEnvironment("SUPABASE_ACCESS_TOKEN");
  const projectRef = requiredEnvironment("SUPABASE_PROJECT_ID");
  if (!PROJECT_REF_PATTERN.test(projectRef)) {
    throw new Error(
      "SUPABASE_PROJECT_ID 형식이 올바르지 않습니다: ^[a-z0-9]{20}$",
    );
  }

  const migrationDirectory = join(process.cwd(), "supabase", "migrations");
  const localMigrations = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((file) => {
      const match = MIGRATION_FILE_PATTERN.exec(file);
      if (!match)
        throw new Error(
          "migration 파일명이 승인된 timestamp_name 형식이 아닙니다.",
        );
      return {
        file,
        localVersion: match[1],
        name: basename(file, ".sql"),
        sql: readFileSync(join(migrationDirectory, file), "utf8"),
      };
    });
  if (localMigrations.length !== 2)
    throw new Error(
      "Task 3 migration 파일은 초기와 보정 migration 두 개여야 합니다.",
    );

  const project = await managementRequest(projectRef, token, "");
  if (project?.name !== EXPECTED_PROJECT_NAME) {
    throw new Error("대상이 승인된 전용 개발 프로젝트가 아닙니다.");
  }
  console.log(`프로젝트 식별 PASS: ${EXPECTED_PROJECT_NAME}`);

  let migrations = await managementRequest(
    projectRef,
    token,
    "/database/migrations",
  );
  if (!Array.isArray(migrations))
    throw new Error("migration 이력 응답 형식이 올바르지 않습니다.");
  const appliedMigrations = [];
  for (const local of localMigrations) {
    const sameName = migrations.filter((item) => item?.name === local.name);
    if (sameName.length > 1)
      throw new Error(`중복 migration 이력 발견: ${local.name}`);
    const knownVersion = KNOWN_REMOTE_VERSIONS.get(local.name);
    if (
      sameName.length === 1 &&
      knownVersion &&
      sameName[0].version !== knownVersion
    ) {
      throw new Error(`고정 원격 migration version 불일치: ${local.name}`);
    }
    let applied = sameName[0];
    if (!applied) {
      await managementRequest(projectRef, token, "/database/query", {
        method: "POST",
        body: JSON.stringify({ query: `BEGIN;\n${local.sql}\nROLLBACK;` }),
      });
      console.log(`원격 migration dry-run PASS: ${local.localVersion}`);
      await managementRequest(projectRef, token, "/database/migrations", {
        method: "POST",
        body: JSON.stringify({ query: local.sql, name: local.name }),
      });
      console.log(`원격 migration 적용 PASS: ${local.localVersion}`);
      migrations = await managementRequest(
        projectRef,
        token,
        "/database/migrations",
      );
      const newlyApplied = migrations.filter(
        (item) => item?.name === local.name,
      );
      if (newlyApplied.length !== 1)
        throw new Error(
          `적용 후 migration 이력을 확정할 수 없습니다: ${local.name}`,
        );
      applied = newlyApplied[0];
    } else {
      console.log(`원격 migration 중복 적용 방지 PASS: ${local.localVersion}`);
    }
    await verifyMigrationDetails(projectRef, token, applied, local.sql);
    appliedMigrations.push({ ...local, remoteVersion: applied.version });
    console.log(
      `원격 migration 이력·SQL PASS: local=${local.localVersion}, remote=${applied.version}`,
    );
  }

  const pgTapSql = buildRemotePgTap(
    readFileSync(
      join(process.cwd(), "supabase", "tests", "database.test.sql"),
      "utf8",
    ),
  );
  const pgTapResult = await managementRequest(
    projectRef,
    token,
    "/database/query",
    {
      method: "POST",
      body: JSON.stringify({ query: pgTapSql }),
    },
  );
  assertPgTap(pgTapResult);
  console.log(`원격 pgTAP PASS: ${EXPECTED_ASSERTIONS}/${EXPECTED_ASSERTIONS}`);

  const verificationResult = await managementRequest(
    projectRef,
    token,
    "/database/query",
    {
      method: "POST",
      body: JSON.stringify({ query: verificationSql, read_only: true }),
    },
  );
  assertDatabaseChecks(verificationResult);
  console.log("원격 RLS·제약·인덱스·함수 권한 PASS: 8/8");

  const typesResponse = await managementRequest(
    projectRef,
    token,
    "/types/typescript?included_schemas=public",
  );
  if (
    typeof typesResponse?.types !== "string" ||
    !typesResponse.types.includes("export type")
  ) {
    throw new Error("TypeScript 타입 생성 응답 형식이 올바르지 않습니다.");
  }
  new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(typesResponse.types),
  );
  writeFileSync("/tmp/generated-types.ts", typesResponse.types, "utf8");
  console.log("원격 TypeScript 타입 생성 PASS");

  const security = advisorFailures(
    await managementRequest(projectRef, token, "/advisors/security"),
    "security",
  );
  const performance = advisorFailures(
    await managementRequest(projectRef, token, "/advisors/performance"),
    "performance",
  );
  console.log(
    `Database Advisors 조회 PASS: security=${security.total} ${JSON.stringify(security.levels)}, performance=${performance.total} ${JSON.stringify(performance.levels)}`,
  );
  if (security.blocking.length || performance.blocking.length) {
    throw new Error(
      `Database Advisors 차단 항목: security=${security.blocking.length}, performance=${performance.blocking.length}`,
    );
  }

  appendSummary([
    "## Task 3 원격 Supabase 검증",
    "",
    `- 프로젝트 식별: PASS (${EXPECTED_PROJECT_NAME})`,
    `- migrations: PASS (${appliedMigrations.map((item) => `${item.localVersion}->${item.remoteVersion}`).join(", ")})`,
    `- pgTAP: PASS (${EXPECTED_ASSERTIONS}/${EXPECTED_ASSERTIONS})`,
    "- RLS·DB 계약: PASS (8/8)",
    `- Advisors: PASS (security ${security.total}, performance ${performance.total})`,
  ]);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  console.error(message);
  process.exitCode = 1;
});
