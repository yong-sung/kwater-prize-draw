# K-water 경품추첨 웹 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** QR 응모, 서버 추첨, 강연장 순차 공개, 개인 결과 공유, 7일 후 개인정보 삭제를 지원하는 단일 행사 재사용형 웹을 구축한다.

**Architecture:** Next.js App Router가 참석자·강연장·관리자 화면과 서버 Route Handler를 제공하고 Vercel에 배포된다. Supabase Postgres는 행사 상태와 암호화 개인정보 및 추첨 결과를 저장하며, 민감한 변경은 PostgreSQL 함수와 서버 전용 API에서만 실행한다. 실시간 알림은 개인정보를 싣지 않고 상태 변경 사실만 전달하며 각 화면은 알림 수신 후 권한에 맞는 API를 다시 조회한다.

**Tech Stack:** Node.js 20.9 이상, Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Realtime, Zod, jose, bcryptjs, Vitest, Testing Library, Playwright, k6, Vercel

**Spec:** docs/superpowers/specs/2026-09-09-prize-draw-web-design.md

## Global Constraints

- 작성 문서, 화면 문구, 주석은 한국어를 기본으로 한다.
- 한 번에 하나의 행사만 활성화한다.
- 행사 기본 경품은 스캔기기 10개, 텀블러 10개, 키보드 10개다.
- 한 참석자는 최대 한 개의 경품만 받을 수 있다.
- 연락처 기준으로 행사당 한 번만 응모할 수 있다.
- 추첨은 응모 마감 후 서버에서 한 번만 실행하고 전체 재추첨을 제공하지 않는다.
- 발표 순서는 스캔기기, 텀블러, 키보드다.
- 결과 공유 전에는 개인 당첨 여부를 반환하지 않는다.
- 개인정보와 개인별 결과는 결과 공유 시각으로부터 7일 후 삭제한다.
- 이름, 연락처, 부서는 서버에서 암호화해 저장하고 로그에 남기지 않는다.
- 참석자 화면은 iPhone Safari, Android Chrome, 삼성 인터넷을 지원한다.
- 강연장 화면은 Chrome 16:9 전체화면과 키보드 Enter 조작을 지원한다.
- 500명 집중 응모에서 누락·중복·중복 당첨이 없어야 한다.
- 모든 기능은 테스트 우선으로 구현하고 작업별로 커밋한다.

---

## 1. 이 계획서 사용 순서

1. 설계서와 이 계획서를 프로젝트의 docs/superpowers 디렉터리에 둔다.
2. 다섯 개 기준 이미지를 context/design-reference 디렉터리에 둔다.
3. 두 방울이 PNG를 public/images의 영문 파일명으로 복사한다.
4. Codex에 한 번에 전체 구현을 요청하지 말고 아래 Task를 하나씩 요청한다.
5. 각 Task의 테스트 결과와 변경 파일을 검토하고 커밋한 뒤 다음 Task로 이동한다.
6. 운영 배포는 Preview 검증 결과를 확인한 뒤 별도 승인한다.

## 2. 목표 파일 구조

~~~text
kwater-prize-draw/
├─ AGENTS.md
├─ context/design-reference/
│  ├─ IMG_4893.png
│  ├─ IMG_4894.png
│  ├─ IMG_4895.png
│  ├─ 행복해하는 방울이.png
│  └─ 슬퍼하는 방울이.png
├─ docs/superpowers/
│  ├─ specs/2026-09-09-prize-draw-web-design.md
│  └─ plans/2026-09-09-prize-draw-web-implementation.md
├─ public/images/
│  ├─ bangwool-happy.png
│  └─ bangwool-sad.png
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ display/page.tsx
│  │  ├─ admin/page.tsx
│  │  └─ api/
│  ├─ features/
│  │  ├─ participant/
│  │  ├─ admin/
│  │  └─ display/
│  ├─ lib/
│  │  ├─ domain/
│  │  ├─ security/
│  │  ├─ supabase/
│  │  └─ realtime/
│  └─ test/
├─ supabase/migrations/202609090001_initial.sql
├─ tests/e2e/
├─ tests/load/
├─ .env.example
├─ vitest.config.ts
├─ playwright.config.ts
└─ vercel.json
~~~

---

### Task 1: 프로젝트 기반과 개발 계약

**Files:**
- Create: 전체 Next.js 프로젝트
- Create: AGENTS.md
- Create: .env.example
- Create: vitest.config.ts
- Create: src/test/setup.ts
- Modify: package.json
- Test: src/app/page.test.tsx

**Interfaces:**
- Consumes: 없음
- Produces: npm run test:run, npm run typecheck, npm run lint, npm run build 명령과 @/* 경로 별칭

- [ ] **Step 1: 프로젝트를 생성하고 의존성을 설치한다**

~~~bash
npx create-next-app@latest kwater-prize-draw --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
cd kwater-prize-draw
npm install @supabase/supabase-js zod jose bcryptjs qrcode.react
npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test supabase
~~~

Expected: npm run dev로 기본 Next.js 화면이 열리고 설치 오류가 없다.

- [ ] **Step 2: 환경변수 계약을 작성한다**

Create .env.example:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD_HASH=BCRYPT_HASH
ADMIN_SESSION_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
PII_ENCRYPTION_KEY=32_RANDOM_BYTES_BASE64
PHONE_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
PARTICIPANT_TOKEN_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
LOGIN_RATE_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
CRON_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
~~~

- [ ] **Step 3: 테스트 설정과 실패하는 첫 화면 테스트를 작성한다**

Create vitest.config.ts:

~~~ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
~~~

Create src/test/setup.ts:

~~~ts
import "@testing-library/jest-dom/vitest";
~~~

Create src/app/page.test.tsx:

~~~tsx
import { render, screen } from "@testing-library/react";
import Home from "./page";

it("K-water 경품추첨 제목을 표시한다", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "K-water 경품추첨" })).toBeInTheDocument();
});
~~~

- [ ] **Step 4: 테스트를 실행해 실패를 확인한다**

Run: npx vitest run src/app/page.test.tsx

Expected: 제목을 찾지 못해 FAIL.

- [ ] **Step 5: 최소 첫 화면과 npm 스크립트를 추가한다**

Replace src/app/page.tsx:

~~~tsx
export default function Home() {
  return <h1>K-water 경품추첨</h1>;
}
~~~

Add these scripts to package.json without deleting the existing scripts:

~~~json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
~~~

- [ ] **Step 6: AGENTS.md에 프로젝트 규칙을 기록한다**

~~~markdown
# K-water 경품추첨 개발 규칙

- 모든 설명, 문서, 화면 문구는 한국어를 기본으로 작성한다.
- docs/superpowers/specs의 설계서와 docs/superpowers/plans의 구현 계획을 우선한다.
- Task를 하나씩 TDD로 수행하고 범위를 임의로 확장하지 않는다.
- 개인정보 원문, 비밀키, 관리자 비밀번호를 코드·로그·Git에 남기지 않는다.
- 추첨과 상태 변경은 서버 및 데이터베이스 트랜잭션에서만 실행한다.
- 작업 완료 전 test:run, typecheck, lint, build를 실행한다.
- 기존 사용자 변경을 덮어쓰거나 되돌리지 않는다.
~~~

- [ ] **Step 7: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add .
git commit -m "chore: initialize prize draw application"
~~~

Expected: 모든 명령 PASS.

**Codex 요청문:**

~~~text
설계서와 구현 계획의 Task 1만 수행해줘. TDD 순서를 지키고 각 명령의 실제 결과를 보고해. 범위를 Task 1 밖으로 확장하지 말고 성공하면 커밋까지 진행해.
~~~

---

### Task 2: 도메인 상태·입력 검증·암호화

**Files:**
- Create: src/lib/domain/types.ts
- Create: src/lib/domain/state-machine.ts
- Create: src/lib/domain/validation.ts
- Create: src/lib/security/pii.ts
- Test: src/lib/domain/state-machine.test.ts
- Test: src/lib/domain/validation.test.ts
- Test: src/lib/security/pii.test.ts

**Interfaces:**
- Consumes: Node crypto, Zod
- Produces: EventStatus, assertTransition(), participantSchema, normalizePhone(), encryptPii(), decryptPii(), hashPhone(), hashAccessToken()

- [ ] **Step 1: 상태 전환 실패 테스트를 작성한다**

~~~ts
import { describe, expect, it } from "vitest";
import { assertTransition } from "./state-machine";

describe("assertTransition", () => {
  it("CLOSED에서 OPEN 재개를 허용한다", () => {
    expect(() => assertTransition("CLOSED", "OPEN")).not.toThrow();
  });
  it("DRAWN에서 OPEN 전환을 거부한다", () => {
    expect(() => assertTransition("DRAWN", "OPEN")).toThrow("허용되지 않는 행사 상태 전환");
  });
});
~~~

- [ ] **Step 2: 연락처와 동의 검증 실패 테스트를 작성한다**

~~~ts
import { expect, it } from "vitest";
import { normalizePhone, participantSchema } from "./validation";

it("연락처에서 하이픈과 공백을 제거한다", () => {
  expect(normalizePhone("010-1234 5678")).toBe("01012345678");
});

it("개인정보 미동의를 거부한다", () => {
  expect(() => participantSchema.parse({
    name: "홍길동",
    phone: "01012345678",
    department: "디지털관리처",
    privacyConsent: false,
    accessToken: "a".repeat(43),
  })).toThrow();
});
~~~

- [ ] **Step 3: 암호화 왕복과 결정적 해시 테스트를 작성한다**

~~~ts
import { expect, it } from "vitest";
import { decryptPii, encryptPii, hashPhone } from "./pii";

it("암호화한 개인정보를 복호화한다", () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  expect(decryptPii(encryptPii("홍길동", key), key)).toBe("홍길동");
});

it("같은 연락처는 같은 해시를 만든다", () => {
  expect(hashPhone("01012345678", "secret")).toBe(hashPhone("01012345678", "secret"));
});
~~~

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: npx vitest run src/lib/domain src/lib/security

Expected: 모듈이 없어 FAIL.

- [ ] **Step 5: 도메인 타입과 상태 전환을 구현한다**

Create src/lib/domain/types.ts:

~~~ts
export const EVENT_STATUSES = [
  "SETUP", "OPEN", "CLOSED", "DRAWN",
  "REVEALING", "REVEALED", "PUBLISHED", "PURGED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type PrizeCode = "SCANNER" | "TUMBLER" | "KEYBOARD";
~~~

Create src/lib/domain/state-machine.ts:

~~~ts
import type { EventStatus } from "./types";

const allowed: Record<EventStatus, EventStatus[]> = {
  SETUP: ["OPEN"],
  OPEN: ["CLOSED"],
  CLOSED: ["OPEN", "DRAWN"],
  DRAWN: ["REVEALING", "REVEALED"],
  REVEALING: ["REVEALING", "REVEALED"],
  REVEALED: ["PUBLISHED"],
  PUBLISHED: ["PURGED"],
  PURGED: ["SETUP"],
};

export function assertTransition(from: EventStatus, to: EventStatus): void {
  if (!allowed[from].includes(to)) throw new Error("허용되지 않는 행사 상태 전환");
}
~~~

- [ ] **Step 6: 입력 검증을 구현한다**

Create src/lib/domain/validation.ts:

~~~ts
import { z } from "zod";

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export const participantSchema = z.object({
  name: z.string().trim().min(2).max(30),
  phone: z.string().transform(normalizePhone).refine((v) => /^01\d{8,9}$/.test(v)),
  department: z.string().trim().min(2).max(60),
  privacyConsent: z.literal(true),
  accessToken: z.string().min(43).max(128),
});
~~~

- [ ] **Step 7: AES-256-GCM 암호화와 HMAC 해시를 구현한다**

Create src/lib/security/pii.ts:

~~~ts
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

export function encryptPii(plain: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) throw new Error("PII_ENCRYPTION_KEY는 32바이트여야 합니다");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((v) => v.toString("base64url")).join(".");
}

export function decryptPii(value: string, keyBase64: string): string {
  const [iv, tag, encrypted] = value.split(".").map((v) => Buffer.from(v, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyBase64, "base64"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}
export const hashPhone = (phone: string, secret: string) => hmac(phone, secret);
export const hashAccessToken = (token: string, secret: string) => hmac(token, secret);
~~~

- [ ] **Step 8: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
git add src/lib
git commit -m "feat: add event domain and pii security"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 2만 수행해줘. 상태 전환, 입력 검증, AES-256-GCM 암호화, HMAC 해시를 테스트 우선으로 구현하고 전체 테스트 및 타입검사를 통과시킨 뒤 커밋해.
~~~

---

### Task 3: Supabase 스키마·접근 정책·원자적 추첨 함수

**Files:**
- Create: supabase/config.toml
- Create: supabase/migrations/202609090001_initial.sql
- Create: src/lib/supabase/server.ts
- Create: src/lib/supabase/browser.ts
- Create: src/lib/supabase/types.ts
- Test: src/lib/supabase/schema-contract.test.ts

**Interfaces:**
- Consumes: Supabase 환경변수
- Produces: createServerClient(), createRealtimeClient(), execute_draw(), draw_replacement(), reveal_next(), publish_results(), purge_expired_events()

- [ ] **Step 1: 스키마 계약 테스트를 작성한다**

~~~ts
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202609090001_initial.sql", "utf8");

it("중복 응모와 중복 당첨 제약을 선언한다", () => {
  expect(sql).toContain("unique (event_id, phone_hash)");
  expect(sql).toContain("unique (event_id, participant_id)");
});

it("민감 테이블의 RLS를 활성화한다", () => {
  for (const table of ["participants", "draw_results", "audit_logs"]) {
    expect(sql).toContain("alter table public." + table + " enable row level security");
  }
});
~~~

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: npx vitest run src/lib/supabase/schema-contract.test.ts

Expected: migration 파일이 없어 FAIL.

- [ ] **Step 3: 핵심 테이블을 migration에 작성한다**

~~~sql
create extension if not exists pgcrypto;
create type public.event_status as enum
  ('SETUP','OPEN','CLOSED','DRAWN','REVEALING','REVEALED','PUBLISHED','PURGED');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  venue text not null default '',
  starts_at timestamptz,
  privacy_items text[] not null default array['이름','연락처','부서'],
  privacy_purpose text not null default '참석자 사전조회 및 이벤트 진행',
  retention_days integer not null default 7 check (retention_days = 7),
  status public.event_status not null default 'SETUP',
  published_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index only_one_live_event on public.events ((true)) where status <> 'PURGED';

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null check (code in ('SCANNER','TUMBLER','KEYBOARD')),
  name text not null,
  quantity integer not null check (quantity >= 0 and quantity <= 500),
  reveal_order integer not null,
  unique (event_id, code),
  unique (event_id, reveal_order)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name_ciphertext text not null,
  phone_ciphertext text not null,
  department_ciphertext text not null,
  phone_hash text not null,
  access_token_hash text not null unique,
  consented_at timestamptz not null,
  disqualified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, phone_hash)
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete cascade,
  reveal_position integer not null,
  revealed_at timestamptz,
  replaced_at timestamptz,
  unawarded_at timestamptz,
  replacement_reason text,
  created_at timestamptz not null default now(),
  unique (event_id, participant_id),
  unique (prize_id, reveal_position)
);

create table public.reveal_state (
  event_id uuid primary key references public.events(id) on delete cascade,
  revealed_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete cascade,
  action text not null,
  reason text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admin_login_attempts (
  ip_hash text primary key,
  failures integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
~~~

- [ ] **Step 4: RLS와 서버 전용 접근을 적용한다**

~~~sql
alter table public.events enable row level security;
alter table public.prizes enable row level security;
alter table public.participants enable row level security;
alter table public.draw_results enable row level security;
alter table public.reveal_state enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on all tables in schema public from anon, authenticated;
~~~

브라우저 역할에는 직접 테이블 권한을 주지 않는다. 애플리케이션 읽기·쓰기는 서버 Route Handler를 통과한다.

- [ ] **Step 5: 최초 추첨 PostgreSQL 함수를 작성한다**

~~~sql
create or replace function public.execute_draw(p_event_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare v_status public.event_status; v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text, 0));
  select status into v_status from events where id = p_event_id for update;
  if v_status <> 'CLOSED' then raise exception 'EVENT_NOT_CLOSED'; end if;
  if exists (select 1 from draw_results where event_id = p_event_id) then
    select count(*) into v_count from draw_results where event_id = p_event_id;
    return v_count;
  end if;

  with shuffled_people as (
    select id, row_number() over (order by gen_random_uuid()) rn
    from participants where event_id = p_event_id and disqualified_at is null
  ), prize_slots as (
    select p.id prize_id, row_number() over (order by gen_random_uuid()) rn
    from prizes p cross join lateral generate_series(1, p.quantity)
    where p.event_id = p_event_id
  ), assigned as (
    select sp.id participant_id, ps.prize_id
    from shuffled_people sp join prize_slots ps using (rn)
  ), ranked as (
    select participant_id, prize_id,
      row_number() over (partition by prize_id order by gen_random_uuid()) reveal_position
    from assigned
  )
  insert into draw_results(event_id, participant_id, prize_id, reveal_position)
  select p_event_id, participant_id, prize_id, reveal_position from ranked;

  insert into reveal_state(event_id) values (p_event_id);
  update events set status = 'DRAWN', updated_at = now() where id = p_event_id;
  insert into audit_logs(event_id, action) values (p_event_id, 'DRAW_EXECUTED');
  select count(*) into v_count from draw_results where event_id = p_event_id;
  return v_count;
end;
$$;
~~~

- [ ] **Step 6: 나머지 원자적 함수를 완성한다**

draw_replacement, reveal_next, publish_results, purge_expired_events를 SECURITY DEFINER 함수로 구현한다. 모든 함수는 행사별 advisory transaction lock, 상태 검사, 작업 이력 기록을 포함하고 anon/authenticated에는 실행 권한을 주지 않는다.

Return contracts:

~~~ts
type ReplacementResult = {
  resultId: string;
  removedParticipantId: string;
  replacementParticipantId: string | null;
};
type RevealResult = { status: "REVEALING" | "REVEALED"; resultId: string | null };
type PublishResult = { publishedAt: string; purgeAt: string };
type PurgeResult = { purgedEventIds: string[] };
~~~

draw_replacement는 기존 draw_results 행의 participant_id만 대체 참석자로 갱신해 경품과 reveal_position을 보존한다. 이전 참석자는 disqualified_at을 기록하고 변경 전후 식별자는 audit_logs에 남긴다. 후보가 없으면 unawarded_at을 기록해 해당 슬롯을 미추첨 처리한다.

모든 함수를 만든 다음 공개 실행 권한을 다시 회수한다:

~~~sql
revoke all on function public.execute_draw(uuid) from public, anon, authenticated;
revoke all on function public.draw_replacement(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reveal_next(uuid) from public, anon, authenticated;
revoke all on function public.publish_results(uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_events() from public, anon, authenticated;
~~~

- [ ] **Step 7: Supabase clients를 작성한다**

src/lib/supabase/server.ts의 createServerClient()는 SUPABASE_SERVICE_ROLE_KEY와 persistSession: false를 사용한다. src/lib/supabase/browser.ts의 createRealtimeClient()는 공개 URL과 anon key만 사용하고 개인정보 없는 Broadcast 구독에만 사용한다.

- [ ] **Step 8: 로컬 데이터베이스와 테스트를 검증한다**

~~~bash
npx supabase init
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/lib/supabase/types.ts
npm run test:run
npm run typecheck
git add supabase src/lib/supabase
git commit -m "feat: add secure prize draw database"
~~~

Expected: migration과 계약 테스트 PASS.

**Codex 요청문:**

~~~text
구현 계획 Task 3만 수행해줘. Supabase migration과 서버 전용 접근 정책, 원자적 추첨·대체추첨·순차공개·결과공유·만료삭제 함수를 완성해. 상태 조건을 SQL에서 강제하고 로컬 DB reset과 테스트 결과를 보고한 뒤 커밋해.
~~~

---

### Task 4: 공용 비밀번호 인증과 관리자 세션

**Files:**
- Create: src/lib/security/admin-session.ts
- Create: src/lib/security/rate-limit.ts
- Create: src/app/api/auth/login/route.ts
- Create: src/app/api/auth/logout/route.ts
- Create: src/features/admin/AdminLogin.tsx
- Test: src/lib/security/admin-session.test.ts
- Test: src/app/api/auth/login/route.test.ts

**Interfaces:**
- Consumes: ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET
- Produces: createAdminSession(), verifyAdminSession(), requireAdmin(), POST /api/auth/login, POST /api/auth/logout

- [ ] **Step 1: 세션 검증 테스트를 작성한다**

~~~ts
import { expect, it } from "vitest";
import { createAdminSession, verifyAdminSession } from "./admin-session";

it("발급한 세션을 검증한다", async () => {
  const secret = "x".repeat(32);
  const token = await createAdminSession(secret, 3600);
  await expect(verifyAdminSession(token, secret)).resolves.toMatchObject({ role: "admin" });
});
~~~

- [ ] **Step 2: 로그인 Route 테스트를 작성한다**

~~~text
정확한 비밀번호 -> 200과 admin_session HttpOnly 쿠키
틀린 비밀번호 -> 401이며 쿠키 없음
10분 안에 5회 연속 실패 -> 429와 blockedUntil
성공 -> 실패 횟수 초기화
로그아웃 -> 쿠키 즉시 만료
~~~

- [ ] **Step 3: 실패를 확인한다**

Run: npx vitest run src/lib/security/admin-session.test.ts src/app/api/auth/login/route.test.ts

Expected: 모듈 없음으로 FAIL.

- [ ] **Step 4: jose 기반 세션을 구현한다**

~~~ts
import { SignJWT, jwtVerify } from "jose";
const encoder = new TextEncoder();

export async function createAdminSession(secret: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(encoder.encode(secret));
}

export async function verifyAdminSession(token: string, secret: string) {
  const result = await jwtVerify(token, encoder.encode(secret));
  if (result.payload.role !== "admin") throw new Error("ADMIN_REQUIRED");
  return result.payload as { role: "admin"; exp: number };
}
~~~

- [ ] **Step 5: 로그인 제한과 Route Handler를 구현한다**

- bcrypt.compare로 ADMIN_PASSWORD_HASH를 검증한다.
- IP 원문 대신 LOGIN_RATE_HASH_SECRET으로 만든 HMAC만 admin_login_attempts에 저장한다.
- 10분 안에 5회 실패하면 15분 동안 429를 반환한다.
- 성공 시 실패 기록을 지우고 admin_session 쿠키를 8시간으로 설정한다.
- cookie attributes: httpOnly true, secure production only, sameSite strict, path /.

- [ ] **Step 6: 로그인 UI를 구현한다**

~~~ts
type AdminLoginProps = { onSuccess?: () => void };
~~~

비밀번호, 로그인 버튼, 오류 메시지, 잠금 남은 시간을 제공한다. 비밀번호를 URL, localStorage, console에 남기지 않는다.

- [ ] **Step 7: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
git add src/lib/security src/app/api/auth src/features/admin
git commit -m "feat: protect admin and display access"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 4만 수행해줘. 공용 비밀번호, 서버측 실패 제한, 8시간 HttpOnly 세션, 로그아웃을 테스트 우선으로 구현해. 비밀번호와 IP 원문이 저장·기록되지 않는지 확인하고 커밋해.
~~~

---

### Task 5: 공개 행사 조회와 참석자 응모 API

**Files:**
- Create: src/lib/domain/public-event.ts
- Create: src/lib/domain/participant.ts
- Create: src/app/api/public/event/route.ts
- Create: src/app/api/participants/route.ts
- Create: src/app/api/participants/result/route.ts
- Test: src/app/api/participants/route.test.ts
- Test: src/app/api/participants/result/route.test.ts

**Interfaces:**
- Consumes: participantSchema, encryptPii(), hashPhone(), hashAccessToken(), createServerClient()
- Produces: GET /api/public/event, POST /api/participants, GET /api/participants/result

- [ ] **Step 1: 응모 API 계약 테스트를 작성한다**

~~~text
OPEN + 유효 입력 -> 201, participantId만 반환
동일 전화 + 동일 토큰 재시도 -> 200, 기존 participantId 반환
동일 전화 + 다른 토큰 -> 409 DUPLICATE_PHONE
CLOSED -> 409 EVENT_CLOSED
privacyConsent false -> 400 INVALID_INPUT
응답과 로그에 name, phone, department 원문 없음
~~~

- [ ] **Step 2: 개인 결과 API 계약 테스트를 작성한다**

~~~text
토큰 없음 -> 401
알 수 없는 토큰 -> 404
DRAWN 또는 REVEALED -> 200 { state: "WAITING" }
PUBLISHED 당첨자 -> 200 { state: "WINNER", name, prizeName }
PUBLISHED 미당첨자 -> 200 { state: "NOT_WINNER", name }
다른 참가자의 결과는 반환하지 않음
~~~

- [ ] **Step 3: 테스트 실패를 확인한다**

Run: npx vitest run src/app/api/participants

Expected: Route Handler 없음으로 FAIL.

- [ ] **Step 4: 공개 행사 응답 형식을 구현한다**

~~~ts
export type PublicEventResponse = {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string | null;
  status: "SETUP" | "OPEN" | "CLOSED" | "DRAWN" | "REVEALING" | "REVEALED" | "PUBLISHED" | "PURGED";
  participantCount: number;
  privacy: { items: string[]; purpose: string; retentionDays: 7 };
};
~~~

- [ ] **Step 5: 응모 저장을 구현한다**

브라우저는 제출 전에 crypto.getRandomValues로 43자 이상의 accessToken을 생성해 kwater-prize-access-token에 저장하고 HTTPS로 전송한다. 서버는 입력 파싱, 행사 OPEN 재확인, 개인정보 암호화, PHONE_HASH_SECRET을 사용한 연락처 해시, PARTICIPANT_TOKEN_HASH_SECRET을 사용한 토큰 해시, insert를 순서대로 실행한다. 고유 제약 오류는 같은 토큰의 재시도면 기존 등록 성공으로, 다른 토큰이면 DUPLICATE_PHONE으로 변환한다.

- [ ] **Step 6: 개인 결과 조회를 구현한다**

Authorization: Bearer ACCESS_TOKEN을 사용한다. 서버는 PARTICIPANT_TOKEN_HASH_SECRET으로 토큰을 해시해 한 명만 찾고 행사 상태를 검사한 뒤 그 참석자에게 허용된 필드만 복호화한다.

- [ ] **Step 7: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
git add src/lib/domain src/app/api/public src/app/api/participants
git commit -m "feat: add secure participant entry api"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 5만 수행해줘. 공개 행사 조회, 연락처 중복 방지 응모, 개인 토큰 기반 결과 조회 API를 테스트 우선으로 구현해. 민감정보가 응답·로그에 불필요하게 포함되지 않는지 테스트하고 커밋해.
~~~

---

### Task 6: 참석자 모바일 화면

**Files:**
- Create: src/features/participant/ParticipantApp.tsx
- Create: src/features/participant/EntryForm.tsx
- Create: src/features/participant/WaitingScreen.tsx
- Create: src/features/participant/ResultScreen.tsx
- Create: src/features/participant/useParticipantState.ts
- Modify: src/app/page.tsx
- Modify: src/app/globals.css
- Test: src/features/participant/ParticipantApp.test.tsx

**Interfaces:**
- Consumes: 공개 행사·응모·개인 결과 API
- Produces: 모바일 응모·대기·당첨·미당첨·마감 화면

- [ ] **Step 1: 화면 상태 테스트를 작성한다**

~~~tsx
it("OPEN이면 네 개 필수 항목과 경품 응모 버튼을 표시한다", async () => {});
it("미동의 상태에서는 응모 버튼을 비활성화한다", async () => {});
it("응모 성공 후 대기 화면을 표시한다", async () => {});
it("WINNER이면 행복한 방울이와 경품명을 표시한다", async () => {});
it("NOT_WINNER이면 슬퍼하는 방울이와 꽝 문구를 표시한다", async () => {});
it("미응모 상태에서 CLOSED이면 마감 화면을 표시한다", async () => {});
~~~

구현 전에 각 빈 본문을 Testing Library 상호작용과 fetch mock assertion으로 완성한다.

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: npx vitest run src/features/participant

Expected: 컴포넌트 없음으로 FAIL.

- [ ] **Step 3: EntryForm을 구현한다**

Exact labels:

~~~text
1. 참석자 성함
2. 연락처 (010-0000-0000)
3. 소속부서명
4. 개인정보 수집 및 이용 동의
동의합니다
동의하지 않습니다
경품 응모
~~~

label/input 연결, aria-live 오류 요약, 연락처 inputMode numeric와 autoComplete tel을 적용한다. NAVER 상표는 사용하지 않는다.

- [ ] **Step 4: 화면 상태 모델과 결과 이미지를 구현한다**

~~~ts
type ParticipantView =
  | { kind: "FORM" }
  | { kind: "CLOSED" }
  | { kind: "WAITING"; name: string }
  | { kind: "WINNER"; name: string; prizeName: string }
  | { kind: "NOT_WINNER"; name: string }
  | { kind: "PURGED" };
~~~

WINNER는 /images/bangwool-happy.png와 alt="기뻐하는 방울이", NOT_WINNER는 /images/bangwool-sad.png와 alt="슬퍼하는 방울이"를 사용한다.

- [ ] **Step 5: 승인된 모바일 디자인을 적용한다**

~~~text
배경 #F5F7FA
카드 흰색, radius 24px, 은은한 그림자
주요색 #08B9D6
오류색 #EF3340
입력창·버튼 최소 높이 56px
콘텐츠 최대 너비 720px
모바일 좌우 여백 20px
이미지 object-fit contain, 자르기 금지
~~~

- [ ] **Step 6: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app src/features/participant public/images
git commit -m "feat: build participant entry and result screens"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 6만 수행해줘. 네이버 폼 캡처는 레이아웃 참고로만 사용하고 NAVER 상표는 복제하지 마. 두 방울이 이미지를 public/images의 영문 파일명으로 복사해 결과 화면에 정확히 연결하고 모바일 접근성 테스트까지 통과시켜 커밋해.
~~~

---

### Task 7: 추첨·대체 추첨 서버 API

**Files:**
- Create: src/lib/domain/draw.ts
- Create: src/app/api/admin/draw/route.ts
- Create: src/app/api/admin/replacement/route.ts
- Test: src/app/api/admin/draw/route.test.ts
- Test: src/app/api/admin/replacement/route.test.ts

**Interfaces:**
- Consumes: requireAdmin(), execute_draw(), draw_replacement()
- Produces: POST /api/admin/draw, POST /api/admin/replacement, assertDrawInvariants()

- [ ] **Step 1: 추첨 API 테스트를 작성한다**

~~~text
관리자 세션 없음 -> 401
OPEN 상태 -> 409 EVENT_NOT_CLOSED
CLOSED 상태 -> RPC 한 번 호출, 200 { winnerCount }
동시에 두 번 호출 -> 같은 결과와 winnerCount
응답에 미공개 당첨자 개인정보 없음
~~~

- [ ] **Step 2: 대체 추첨 API 테스트를 작성한다**

~~~text
DRAWN~REVEALED 상태 + 사유 -> 같은 prizeId의 새 당첨자
빈 사유 -> 400
PUBLISHED -> 409 RESULT_ALREADY_PUBLISHED
후보 없음 -> 200 { replacement: null, unawarded: true }
~~~

- [ ] **Step 3: 테스트 실패를 확인한다**

Run: npx vitest run src/app/api/admin/draw src/app/api/admin/replacement

Expected: Route Handler 없음으로 FAIL.

- [ ] **Step 4: 관리자 전용 API와 불변식 검증을 구현한다**

~~~ts
export type DrawInvariantInput = {
  results: { participantId: string; prizeId: string }[];
  prizeLimits: Record<string, number>;
};

export function assertDrawInvariants(input: DrawInvariantInput): void {
  const ids = input.results.map((result) => result.participantId);
  if (new Set(ids).size !== ids.length) throw new Error("DUPLICATE_WINNER");
  for (const [prizeId, limit] of Object.entries(input.prizeLimits)) {
    if (input.results.filter((result) => result.prizeId === prizeId).length > limit) {
      throw new Error("PRIZE_LIMIT_EXCEEDED");
    }
  }
}
~~~

각 Route Handler는 requireAdmin, Zod UUID·사유 검증, RPC 호출, 알려진 SQL 오류의 안정된 오류 코드 변환을 수행한다. 원시 DB 오류 문구는 반환하지 않는다.

- [ ] **Step 5: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
git add src/lib/domain/draw.ts src/app/api/admin
git commit -m "feat: expose atomic draw operations"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 7만 수행해줘. 관리자 추첨과 개별 대체 추첨 API를 SQL RPC에 연결하고 상태 오류, 권한 오류, 중복 실행, 후보 없음까지 테스트해. 추첨 결과 불변식 검증도 추가한 뒤 커밋해.
~~~

---

### Task 8: 관리자 행사·참석자·진행 대시보드

**Files:**
- Create: src/app/api/admin/event/route.ts
- Create: src/app/api/admin/participants/route.ts
- Create: src/app/api/admin/publish/route.ts
- Create: src/features/admin/AdminDashboard.tsx
- Create: src/features/admin/EventSettings.tsx
- Create: src/features/admin/ParticipantTable.tsx
- Create: src/features/admin/DrawControls.tsx
- Modify: src/app/admin/page.tsx
- Test: src/features/admin/AdminDashboard.test.tsx

**Interfaces:**
- Consumes: 관리자 API, AdminLogin
- Produces: 행사 설정·명단 관리·마감·추첨·대체 추첨·결과 공유 UI

- [ ] **Step 1: 상태별 버튼 테스트를 작성한다**

~~~text
SETUP -> 응모 시작 활성
OPEN -> 응모 마감 활성
CLOSED -> 응모 재개와 추첨 실행 활성
DRAWN/REVEALING/REVEALED -> 참석자 수정 비활성
REVEALED -> 결과 공유 활성
PUBLISHED -> 결과 변경 비활성, 삭제 예정일 표시
~~~

- [ ] **Step 2: 개인정보 표시 테스트를 작성한다**

관리자 세션이 있을 때만 성명, 복호화 연락처, 부서가 표시되고 렌더 과정에서 console 출력이 발생하지 않는지 확인한다.

- [ ] **Step 3: 테스트 실패를 확인한다**

Run: npx vitest run src/features/admin

Expected: 컴포넌트 없음으로 FAIL.

- [ ] **Step 4: 관리자 API를 구현한다**

- GET /api/admin/event: 행사, 경품, 인원, 공개 진행률, purgeAt 반환.
- PATCH /api/admin/event: SETUP에서 행사·개인정보 문구·경품 수정, 상태 전환은 assertTransition 적용.
- GET/PATCH/DELETE /api/admin/participants: OPEN 또는 CLOSED에서만 수정·삭제.
- POST /api/admin/publish: REVEALED에서만 publish_results 호출.
- 참석자 목록은 서버에서 복호화하고 ciphertext와 hash는 반환하지 않는다.

- [ ] **Step 5: 관리자 대시보드를 구현한다**

Confirmation copy:

~~~text
응모를 마감할까요? 현재 응모자는 235명입니다.
235명을 대상으로 추첨을 실행할까요? 실행 후 전체 재추첨은 할 수 없습니다.
전체 결과를 참석자에게 공유할까요? 공유 후 당첨 결과를 변경할 수 없습니다.
~~~

한 상태에서 하나의 주 작업을 강조한다. 대체 추첨은 기존 당첨자, 동일 경품, 필수 사유를 보여주고 전체 재추첨 버튼은 만들지 않는다.

- [ ] **Step 6: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app/admin src/app/api/admin src/features/admin
git commit -m "feat: build event administration dashboard"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 8만 수행해줘. 행사 상태별 관리자 버튼, 참석자 관리, 추첨 확인창, 대체 추첨, 결과 공유 UI를 구현해. 서버와 화면 양쪽에서 상태 조건을 강제하고 테스트·빌드를 통과시켜 커밋해.
~~~

---

### Task 9: 강연장 QR 및 Enter 순차 공개

**Files:**
- Create: src/app/api/admin/reveal/route.ts
- Create: src/features/display/DisplayApp.tsx
- Create: src/features/display/QrStage.tsx
- Create: src/features/display/RevealStage.tsx
- Create: src/features/display/useEnterReveal.ts
- Modify: src/app/display/page.tsx
- Test: src/features/display/useEnterReveal.test.tsx
- Test: src/features/display/DisplayApp.test.tsx

**Interfaces:**
- Consumes: requireAdmin(), reveal_next(), 공개 행사 API
- Produces: 인증된 프로젝터 화면과 POST /api/admin/reveal

- [ ] **Step 1: 키보드 입력 테스트를 작성한다**

~~~tsx
it("Enter 한 번에 reveal API를 한 번만 호출한다", async () => {});
it("Enter를 길게 눌러도 잠금 시간 동안 추가 호출하지 않는다", async () => {});
it("입력 요소에 포커스가 있으면 Enter를 무시한다", async () => {});
it("REVEALED 상태에서는 API를 호출하지 않는다", async () => {});
~~~

구현 전에 각 빈 본문을 userEvent.keyboard와 fake timers를 사용한 assertion으로 완성한다.

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: npx vitest run src/features/display

Expected: 모듈 없음으로 FAIL.

- [ ] **Step 3: reveal API 응답 계약을 구현한다**

~~~ts
type RevealApiResponse = {
  eventStatus: "REVEALING" | "REVEALED";
  prizeCode: "SCANNER" | "TUMBLER" | "KEYBOARD" | null;
  prizeName: string | null;
  revealedWinner: { name: string; department: string } | null;
  groups: Array<{
    prizeCode: "SCANNER" | "TUMBLER" | "KEYBOARD";
    prizeName: string;
    winners: Array<{ name: string; department: string }>;
  }>;
};
~~~

세션 검증 후 reveal_next를 호출하고 이미 공개된 이름·부서만 복호화해 반환한다.

- [ ] **Step 4: QR과 순차 공개 화면을 구현한다**

- qrcode.react로 window.location.origin + "/" 인코딩.
- 1080p에서 QR 최소 360px와 흰 여백 유지.
- 16:9 가로 레이아웃.
- 스캔기기, 텀블러, 키보드 순서.
- Enter 500ms 잠금, 공개 애니메이션 700ms.
- prefers-reduced-motion에서는 이동 없이 즉시 표시.
- 새로고침하면 서버의 groups와 현재 상태 재조회.

- [ ] **Step 5: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app/display src/app/api/admin/reveal src/features/display
git commit -m "feat: add auditorium qr and winner reveal"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 9만 수행해줘. 공용 비밀번호 세션으로 보호된 강연장 화면, 16:9 QR 화면, Enter 한 번당 한 명 공개, 공개 순서와 새로고침 복구를 테스트 우선으로 구현하고 커밋해.
~~~

---

### Task 10: 실시간 알림·결과 공유·자동 삭제

**Files:**
- Create: src/lib/realtime/events.ts
- Create: src/features/participant/useEventSignal.ts
- Create: src/app/api/cron/purge/route.ts
- Create: vercel.json
- Test: src/lib/realtime/events.test.ts
- Test: src/app/api/cron/purge/route.test.ts

**Interfaces:**
- Consumes: Supabase Realtime, publish_results(), purge_expired_events()
- Produces: broadcastEventSignal(), subscribeEventSignal(), GET /api/cron/purge

- [ ] **Step 1: 개인정보 없는 신호 계약 테스트를 작성한다**

~~~ts
export type EventSignal = {
  eventId: string;
  status: "OPEN" | "CLOSED" | "DRAWN" | "REVEALING" | "REVEALED" | "PUBLISHED" | "PURGED";
  changedAt: string;
};
~~~

payload에 name, phone, department, participantId, prize assignment, access token, ciphertext가 없음을 검사한다.

- [ ] **Step 2: 결과 공유와 fallback 테스트를 작성한다**

~~~text
REVEALED에서 publish -> publishedAt과 7일 뒤 purgeAt 저장
REVEALING에서 publish -> 409 REVEAL_NOT_COMPLETE
두 번 publish -> 같은 publishedAt 반환
publish 신호 수신 -> 개인 결과 API 재조회
Realtime 실패 -> 5초 간격 상태 조회
~~~

- [ ] **Step 3: cron 인증과 삭제 테스트를 작성한다**

~~~text
잘못된 Authorization -> 401
Bearer CRON_SECRET -> purge_expired_events 호출
만료 전 행사 -> 유지
만료 행사 -> PII와 개인결과 삭제, PURGED
두 번 호출 -> 두 번째도 안전하게 200
~~~

- [ ] **Step 4: 테스트 실패를 확인한다**

Run: npx vitest run src/lib/realtime src/app/api/cron

Expected: 모듈 없음으로 FAIL.

- [ ] **Step 5: Broadcast와 polling fallback을 구현한다**

채널 이름은 event:EVENT_ID:status, 이벤트 이름은 state_changed를 사용한다. 알림을 받으면 반드시 애플리케이션 API에서 권한에 맞는 최신 상태를 다시 조회하며 Broadcast payload를 최종 상태로 신뢰하지 않는다.

- [ ] **Step 6: 일일 삭제 작업을 구성한다**

Create vercel.json:

~~~json
{
  "crons": [
    { "path": "/api/cron/purge", "schedule": "15 18 * * *" }
  ]
}
~~~

18:15 UTC는 한국시간 다음 날 03:15다. 만료된 데이터는 cron 실행 전이라도 조회 API에서 즉시 차단한다.

- [ ] **Step 7: 검증하고 커밋한다**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/lib/realtime src/features/participant src/app/api/cron vercel.json
git commit -m "feat: publish results and purge expired pii"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 10만 수행해줘. 개인정보 없는 상태 Broadcast, 참석자 자동 결과 전환, 5초 polling fallback, 결과 공유 시 7일 만료 설정, 인증된 일일 삭제 cron을 테스트 우선으로 구현하고 커밋해.
~~~

---

### Task 11: E2E·보안·500명 부하 검증

**Files:**
- Create: playwright.config.ts
- Create: tests/e2e/event-flow.spec.ts
- Create: tests/e2e/security.spec.ts
- Create: tests/load/entry.js
- Create: docs/test-report-template.md

**Interfaces:**
- Consumes: 완성된 세 화면과 API
- Produces: npm run test:e2e와 k6 실행 결과

- [ ] **Step 1: Playwright 설정을 작성한다**

~~~ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone-safari", use: { ...devices["iPhone 14"] } },
    { name: "android-chrome", use: { ...devices["Pixel 7"] } }
  ]
});
~~~

- [ ] **Step 2: 전체 행사 E2E를 작성한다**

관리자 로그인, 행사 설정, 응모 시작, 35명 응모, 중복 차단, 마감, 추첨, 세 경품 순차 공개, 한 명 대체 추첨, 결과 공유, 당첨·미당첨 개인 화면, 정확히 30명의 고유 당첨자를 한 테스트에서 검증한다.

- [ ] **Step 3: 보안 E2E를 작성한다**

~~~text
세션 없이 admin API -> 401
세션 없이 display reveal -> 401
다른 참가자 토큰으로 본인 외 결과 접근 불가
공유 전 당첨 여부 비공개
응답에 service key, hash, ciphertext 없음
로그인 5회 실패 후 429
~~~

- [ ] **Step 4: k6 집중 응모 스크립트를 작성한다**

Create tests/load/entry.js:

~~~js
import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    burst: { executor: "shared-iterations", vus: 100, iterations: 500, maxDuration: "60s" }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"]
  }
};

export default function () {
  const id = String(__VU) + "-" + String(__ITER) + "-" + String(Date.now());
  const raw = (__VU * 1000 + __ITER) % 100000000;
  const phoneSuffix = String(raw).padStart(8, "0");
  const accessToken = id.padEnd(43, "x");
  const body = {
    name: "테스트" + id,
    phone: "010" + phoneSuffix,
    department: "부하테스트부",
    privacyConsent: true,
    accessToken
  };
  const response = http.post(
    __ENV.BASE_URL + "/api/participants",
    JSON.stringify(body),
    { headers: { "Content-Type": "application/json" } }
  );
  check(response, { "응모 성공": (r) => r.status === 201 });
}
~~~

- [ ] **Step 5: 전체 검증을 실행한다**

~~~bash
npm run test:run
npm run test:e2e
npm run typecheck
npm run lint
npm run build
k6 run -e BASE_URL=https://PREVIEW_DEPLOYMENT_URL tests/load/entry.js
~~~

Expected: unit/integration/E2E PASS, HTTP 실패율 1% 미만, p95 3초 미만, 저장 참석자 500명, 중복 연락처 0건, 로그 내 개인정보 0건.

- [ ] **Step 6: 결과를 기록하고 커밋한다**

~~~bash
git add playwright.config.ts tests docs/test-report-template.md
git commit -m "test: verify prize draw end to end"
~~~

**Codex 요청문:**

~~~text
구현 계획 Task 11만 수행해줘. Playwright 전체 행사 흐름과 권한 테스트, k6 500건 집중 응모 스크립트를 완성해. 실패가 있으면 원인을 고쳐 모든 검증을 다시 실행하고 결과를 문서화한 뒤 커밋해.
~~~

---

### Task 12: Vercel 운영 배포와 행사 리허설

**Files:**
- Create: docs/deployment.md
- Create: docs/event-day-checklist.md
- Create: docs/privacy-deletion-checklist.md
- Modify: README.md

**Interfaces:**
- Consumes: GitHub 저장소, 운영 Supabase, Vercel 프로젝트
- Produces: 운영 URL, 운영 QR, 배포·복구·행사 체크리스트

- [ ] **Step 1: 배포 문서를 작성한다**

~~~text
1. GitHub main 브랜치 최신화
2. 운영 Supabase 프로젝트 생성
3. migration 적용
4. 운영 환경변수 등록
5. Vercel Preview 배포
6. Preview E2E와 스마트폰 실기기 확인
7. Production 배포
8. Production QR 생성
9. 관리자·강연장 로그인 시험
10. 테스트 데이터 즉시 삭제
~~~

- [ ] **Step 2: 운영 비밀값을 생성하고 등록한다**

다음 명령은 로컬에서 실행하고 출력값을 채팅이나 Git에 남기지 않는다.

~~~bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "관리자가_정한_공용비밀번호"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
~~~

ADMIN_SESSION_SECRET, PII_ENCRYPTION_KEY, PHONE_HASH_SECRET, PARTICIPANT_TOKEN_HASH_SECRET, LOGIN_RATE_HASH_SECRET, CRON_SECRET은 각각 별도로 생성해 Vercel 환경변수에만 등록한다.

- [ ] **Step 3: Supabase와 Vercel을 연결한다**

~~~bash
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
npx vercel link
npx vercel
~~~

Preview 검증 후 사용자 승인을 받고 실행:

~~~bash
npx vercel --prod
~~~

- [ ] **Step 4: 행사 당일 체크리스트를 작성한다**

~~~text
관리자 행사·경품 설정 확인
강연장 노트북 전원·인터넷·Chrome 전체화면
프로젝터 QR 인식
iPhone Safari와 Android Chrome 시험 응모
리허설 데이터 삭제
응모 시작
응모 마감과 최종 인원 확인
추첨 실행 전 확인창 낭독
경품별 Enter 공개
부적격자 발생 시 개별 대체 추첨
전체 공개 후 결과 공유
두 스마트폰에서 결과 자동 전환 확인
개인정보 삭제 예정일 확인
7일 후 삭제 완료 확인
~~~

- [ ] **Step 5: 운영 검증을 실행한다**

~~~bash
npm run test:run
npm run test:e2e
npm run typecheck
npm run lint
npm run build
~~~

Production은 실제 iPhone Safari, Android Chrome 또는 삼성 인터넷, 강연장 노트북·프로젝터에서 수동 검증한다.

- [ ] **Step 6: 최종 문서와 코드를 커밋한다**

~~~bash
git add README.md docs
git commit -m "docs: add deployment and event runbook"
git status --short
~~~

Expected: working tree clean.

**Codex 요청문:**

~~~text
구현 계획 Task 12만 수행해줘. 배포 문서와 행사 당일·개인정보 삭제 체크리스트를 완성하고 Preview 검증까지 진행해. Production 배포는 Preview 테스트 결과를 먼저 보고한 뒤 내가 승인하면 실행해. 비밀값은 화면·로그·Git에 노출하지 말고 최종 검증과 커밋 결과를 보고해.
~~~

---

## 3. 전체 완료 판정

- 12개 Task의 커밋이 존재한다.
- test:run, test:e2e, typecheck, lint, build가 모두 통과한다.
- 500건 집중 응모에서 누락과 중복이 없고 HTTP 실패율이 1% 미만이다.
- 20명, 30명, 35명, 500명 시나리오에서 1인 1경품과 최대 30명 당첨이 지켜진다.
- 스캔기기, 텀블러, 키보드 순서로 한 명씩 공개된다.
- 대체 추첨은 동일 경품에 대해서만 실행되고 전체 결과를 바꾸지 않는다.
- 결과 공유 전 개인 결과가 노출되지 않는다.
- 당첨·미당첨 화면에 승인된 방울이 이미지가 표시된다.
- 관리자와 강연장 API가 공용 비밀번호 세션 없이 실행되지 않는다.
- 이름, 연락처, 부서는 암호화되어 저장되고 로그에 남지 않는다.
- 결과 공유 후 7일 만료와 자동 삭제가 검증된다.
- 실제 iPhone, Android, 강연장 노트북·프로젝터 리허설을 통과한다.

## 4. 공식 참고 문서

- Next.js 설치: https://nextjs.org/docs/app/getting-started/installation
- Next.js App Router: https://nextjs.org/docs/app
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Realtime 구독 방식: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
