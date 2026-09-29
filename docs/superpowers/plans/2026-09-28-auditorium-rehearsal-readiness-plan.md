# 강연장 리허설 준비 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preview 환경에서 전체 경품추첨 흐름을 반복 리허설하고 안전하게 초기화할 수 있는 강연장 준비 상태를 만든다.

**Architecture:** 관리자·참석자 Route Handler는 서버 인증과 Preview 환경 검증을 담당하고, 상태 전환·응모 등록·초기화는 동일한 행사 advisory lock을 사용하는 PostgreSQL RPC에서 원자적으로 실행한다. 초기화는 `SECURITY INVOKER`와 `service_role` 전용 실행 권한을 사용하며 행사·경품 설정을 보존하고 개인정보·추첨·공개 상태만 삭제한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Supabase Postgres, Vitest, Testing Library, Playwright, Vercel Preview

**Spec:** `docs/superpowers/specs/2026-09-28-auditorium-rehearsal-readiness-design.md`

## Global Constraints

- 원래 작업트리와 `context/`, 기존 `.worktrees/`, 사용자 변경은 수정·이동·삭제하지 않는다.
- 운영 Supabase 데이터·환경변수·Vercel 설정과 Production 배포는 변경하지 않는다.
- 초기화는 `VERCEL_ENV=preview`, `ALLOW_REHEARSAL_RESET=true`, 실제/허용 프로젝트 ID 일치가 모두 확인될 때만 허용한다.
- 리허설 데이터는 가짜 이름·연락처·부서만 사용한다.
- 모든 상태 변경과 개인정보 삭제는 서버 및 DB 트랜잭션에서 실행한다.
- 구현 전 관련 Next.js 로컬 문서와 Supabase 공식 문서를 확인한다.

## 스키마 기준 삭제 대상

- `participants`: `name_ciphertext`, `phone_ciphertext`, `department_ciphertext`, `phone_hash`, `access_token_hash`, `consented_at`, `disqualified_at`를 포함한 대상 행사 행 전체.
- `draw_results`: `participant_id`, `revealed_at`, `replaced_at`, `unawarded_at`, 개인정보성 운영 메모가 될 수 있는 `replacement_reason`을 포함한 대상 행사 행 전체.
- `reveal_state`: 대상 행사의 `revealed_count`와 공개 갱신 시각 행 전체.
- `audit_logs`: 대상 행사의 기존 기록을 삭제하여 `reason`과 `detail`에 남을 수 있는 개인정보·운영 메모를 제거하고, 이후 빈 detail의 `REHEARSAL_RESET` 한 건만 생성.
- `events`: 행은 보존하고 `status='SETUP'`, `published_at=null`, `purge_at=null`, `updated_at=statement_timestamp()`로 복귀.
- `prizes`: ID, 코드, 이름, 수량, 공개 순서를 모두 보존.
- `admin_login_attempts`: 행사나 참석자와 연결되지 않으므로 초기화 대상이 아님.

## Review Focus

- 환경변수 하나라도 없거나 공백이면 RPC를 호출하지 않고 `403`을 반환한다.
- Production에서는 허용 플래그와 프로젝트 ID가 맞아도 항상 거부한다.
- 초기화와 응모·상태 전환·추첨이 겹쳐도 동일 advisory lock으로 직렬화되어 잔여/신규 개인정보가 남지 않는다.
- 같은 초기화 요청이 재전송되면 첫 요청 후 `SETUP` 상태에서 안전하게 다시 완료되고 설정은 변하지 않는다.
- QR 목적지는 신뢰하지 않은 요청 Host가 아니라 브라우저가 실제 로드한 Preview origin의 `/`이다.

---

### Task 1: 기준선과 강연장 한국어 회귀

**Files:**
- Modify: `src/features/display/DisplayApp.test.tsx`
- Modify: `src/features/display/DisplayApp.tsx`

**Interfaces:**
- Consumes: `GET /api/display/event`, `POST /api/display/reveal`
- Produces: 정상 한국어 로딩·조회 실패·공개 실패 문구

- [ ] **Step 1: 기준 테스트를 실행한다**

Run: `npm install` 후 `npm run test:run`
Expected: 기존 전체 테스트 PASS.

- [ ] **Step 2: 깨진 문구를 금지하고 정상 한국어를 요구하는 테스트를 작성한다**

`DisplayApp.test.tsx`에서 로딩, 행사 조회 실패, 공개 실패 상태가 각각 정상 한국어를 렌더링하고 `?`가 연속된 깨진 문자열을 포함하지 않는지 검증한다.

- [ ] **Step 3: RED를 확인한다**

Run: `npx vitest run src/features/display/DisplayApp.test.tsx`
Expected: 깨진 현재 문구 때문에 FAIL.

- [ ] **Step 4: 문구만 최소 수정한다**

`DisplayApp.tsx`의 세 문자열을 `행사 정보를 불러오는 중…`, `행사 정보를 불러오지 못했습니다.`, `다음 당첨자를 공개하지 못했습니다.`로 교체한다.

- [ ] **Step 5: GREEN과 전체 회귀를 확인하고 커밋한다**

Run: `npx vitest run src/features/display/DisplayApp.test.tsx && npm run test:run`
Expected: 모두 PASS.

Commit: `fix: 강연장 한글 문구 복구`

### Task 2: 잠금 기반 상태 전환과 응모 재개

**Files:**
- Create: `supabase/migrations/<supabase-cli-timestamp>_auditorium_rehearsal_reset.sql`
- Modify: `supabase/tests/database.test.sql`
- Modify: `src/lib/supabase/types.ts`
- Modify: `src/app/api/admin/event/route.test.ts`
- Modify: `src/app/api/admin/event/route.ts`
- Modify: `src/features/admin/AdminDashboard.test.tsx`
- Modify: `src/features/admin/AdminDashboard.tsx`

**Interfaces:**
- Produces: `transition_event_status(p_event_id uuid, p_expected_status event_status, p_next_status event_status) returns event_status`
- Produces: `CLOSED` 전용 관리자 `응모 재개` 버튼

- [ ] **Step 1: DB와 API/UI 실패 테스트를 작성한다**

pgTAP은 같은 행사 advisory lock과 `FOR UPDATE`, 기대 상태 불일치 거부, `CLOSED → OPEN` 성공, `DRAWN → OPEN` 거부를 검증한다. Route 테스트는 RPC 성공과 오류 매핑을, UI 테스트는 CLOSED에서만 재개 버튼 활성화를 검증한다.

- [ ] **Step 2: RED를 확인한다**

Run: `npx vitest run src/app/api/admin/event/route.test.ts src/features/admin/AdminDashboard.test.tsx`
Expected: RPC와 버튼 부재로 FAIL.

- [ ] **Step 3: CLI로 migration을 생성하고 원자 상태 전환을 구현한다**

Run: `npx supabase migration new auditorium_rehearsal_reset`
Expected: timestamp가 붙은 빈 migration 생성.

함수는 `SECURITY INVOKER`, 빈 `search_path`, 스키마 지정 객체명, 행사별 advisory transaction lock과 행 잠금을 사용한다. `service_role`만 실행 권한을 갖는다. Route Handler는 요청 상태를 직접 update하지 않고 RPC를 호출한다.

- [ ] **Step 4: 관리자 재개 UI를 구현한다**

`CLOSED`에서만 `{ eventId, status: "OPEN", expectedStatus: "CLOSED" }`를 보내고 처리 중 중복 클릭을 막는다.

- [ ] **Step 5: GREEN을 확인하고 커밋한다**

Run: `npx vitest run src/app/api/admin/event/route.test.ts src/features/admin/AdminDashboard.test.tsx src/lib/domain/state-machine.test.ts`
Expected: PASS.

Commit: `feat: 관리자 응모 재개를 원자적으로 처리`

### Task 3: 잠금 기반 응모 등록과 Preview 초기화 RPC

**Files:**
- Modify: Task 2에서 생성한 migration
- Modify: `supabase/tests/database.test.sql`
- Modify: `src/lib/supabase/types.ts`
- Modify: `src/app/api/participants/route.test.ts`
- Modify: `src/app/api/participants/route.ts`
- Create: `src/lib/rehearsal/reset-guard.test.ts`
- Create: `src/lib/rehearsal/reset-guard.ts`
- Create: `src/app/api/admin/rehearsal-reset/route.test.ts`
- Create: `src/app/api/admin/rehearsal-reset/route.ts`

**Interfaces:**
- Produces: `register_participant(...) returns uuid` — 행사 잠금, OPEN 재검증, 연락처/토큰 중복 처리.
- Produces: `reset_rehearsal_event(p_event_id uuid, p_expected_title text) returns jsonb` — Preview API만 호출하는 원자 초기화.
- Produces: `canResetRehearsal(env: NodeJS.ProcessEnv): boolean`.

- [ ] **Step 1: 환경·API·DB 실패 테스트를 먼저 작성한다**

환경 테스트는 Production 무조건 거부, Preview 변수 누락/공백/프로젝트 불일치 거부, 완전 일치 허용을 검증한다. API 테스트는 인증, 행사 ID·행사명·정확한 `리허설 초기화` 문구, RPC 미호출/호출을 검증한다. pgTAP은 허용 상태를 `SETUP|OPEN|CLOSED|DRAWN|REVEALING|REVEALED|PUBLISHED`로 고정하고 `PURGED`를 거부한다.

- [ ] **Step 2: RED를 확인한다**

Run: `npx vitest run src/lib/rehearsal src/app/api/admin/rehearsal-reset src/app/api/participants/route.test.ts`
Expected: 모듈·Route·RPC 부재로 FAIL.

- [ ] **Step 3: 응모 등록 RPC를 구현하고 Route를 전환한다**

기존 암호화·해시 계산은 서버에 유지한다. RPC는 동일 행사 advisory lock, `FOR UPDATE`, `OPEN` 재검증 후 insert하며 같은 토큰 재시도는 기존 ID, 다른 토큰의 같은 연락처는 `DUPLICATE_PHONE` 오류를 반환한다.

- [ ] **Step 4: 초기화 RPC를 `SECURITY INVOKER`로 구현한다**

동일 advisory lock과 행사 행 잠금 후 ID·제목·허용 상태를 검증한다. `draw_results`, `reveal_state`, `participants`, 기존 `audit_logs`를 삭제하고 event 상태/시각을 복귀한 뒤 빈 detail의 `REHEARSAL_RESET`을 삽입한다. 경품/행사 설정 전후 동일성을 pgTAP으로 비교한다. DB 오류는 전체 rollback되어야 한다.

- [ ] **Step 5: Preview guard와 관리자 API를 구현한다**

관리자 인증 → 환경 guard → 입력 검증 → 현재 행사 ID/제목 조회 → RPC 순으로 처리한다. 환경 실패나 입력 불일치에서는 RPC를 만들거나 호출하지 않는다. 오류 응답과 로그에 환경값·개인정보를 포함하지 않는다.

- [ ] **Step 6: GREEN을 확인하고 커밋한다**

Run: `npx vitest run src/lib/rehearsal src/app/api/admin/rehearsal-reset src/app/api/participants/route.test.ts`
Expected: PASS.

Commit: `feat: Preview 리허설 초기화를 원자적으로 처리`

### Task 4: 관리자 초기화 UI와 QR 계약

**Files:**
- Modify: `src/features/admin/AdminDashboard.test.tsx`
- Modify: `src/features/admin/AdminDashboard.tsx`
- Create: `src/features/display/QrStage.test.tsx`
- Modify: `src/features/display/QrStage.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `POST /api/admin/rehearsal-reset`
- Produces: 행사명과 `리허설 초기화` 확인 입력, 중복 요청 차단, 성공 후 재조회

- [ ] **Step 1: UI와 QR 실패 테스트를 작성한다**

확인 두 값이 정확할 때만 버튼 활성화, busy 중 재요청 차단, 성공 후 SETUP 재조회, 오류 표시를 검증한다. QR 테스트는 값이 브라우저의 실제 `window.location.origin + "/"`이고 임의 Host prop/header를 소비하지 않는지 검증한다.

- [ ] **Step 2: RED를 확인한다**

Run: `npx vitest run src/features/admin/AdminDashboard.test.tsx src/features/display/QrStage.test.tsx`
Expected: 초기화 UI와 QR 테스트 seam 부재로 FAIL.

- [ ] **Step 3: 위험 작업 UI와 환경변수 계약을 구현한다**

행사명 입력, 확인 문구 입력, 영향 설명, 비활성/처리 중 상태를 제공한다. `.env.example`에는 값 없는 변수명과 설명만 추가한다.

- [ ] **Step 4: QR 계약을 최소 조정하고 GREEN을 확인한다**

Run: `npx vitest run src/features/admin/AdminDashboard.test.tsx src/features/display/QrStage.test.tsx`
Expected: PASS.

Commit: `feat: 관리자 리허설 초기화 UI 추가`

### Task 5: DB·통합·E2E와 Preview 검증

**Files:**
- Modify: `e2e/admin.spec.ts`
- Create: `e2e/rehearsal-flow.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `study/validation.md`
- Modify: `study/changelog.md`

**Interfaces:**
- Consumes: 모든 관리자·참석자·강연장 API와 Preview 초기화
- Produces: 전체 리허설 흐름 검증 기록

- [ ] **Step 1: 전체 흐름 E2E를 작성한다**

가짜 참석자만 사용해 로그인, QR, 정상/중복 응모, 마감/재개, 재응모, 추첨, Enter 공개, 새로고침 복원, 대체 추첨, 공유, 당첨/미당첨 확인, 초기화, 설정 보존, 초기화 후 재응모를 검증한다. 로컬 mock E2E와 실제 Preview E2E를 분리하고 Preview 테스트는 필요한 기존 환경이 모두 있을 때만 실행한다.

- [ ] **Step 2: migration·pgTAP을 격리 환경에서 검증한다**

우선 기존 CI/Preview 전용 절차를 사용한다. 로컬 Docker가 가능하면 `npm run db:reset && npm run db:test`; 불가능하면 변경 없는 기존 Preview 프로젝트 또는 CI runner만 사용한다. Production은 대체 경로로 사용하지 않는다.

- [ ] **Step 3: 전체 품질 검증을 실행한다**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run format:check && npm run build && npm run test:e2e`
Expected: 모두 PASS.

- [ ] **Step 4: 기존 Preview 연결을 읽기 전용으로 확인한다**

`.vercel/project.json`, 기존 Vercel CLI 인증, Preview 환경변수 이름과 Supabase 프로젝트 ID 일치 여부만 확인한다. 시크릿 값은 출력하지 않는다. 연결/ID/허용 변수가 준비되지 않았으면 외부 배포와 DB 변경을 중단하고 BLOCKED로 기록한다.

- [ ] **Step 5: 가능한 경우 Preview에만 배포하고 리허설한다**

기존 설정이 모두 준비된 경우에만 Preview migration dry-run/적용, Preview 배포, E2E, QR 목적지와 모바일 viewport를 확인한다. Production 옵션·별칭·승격은 사용하지 않는다.

- [ ] **Step 6: 결과 문서와 커밋을 완료한다**

검증 항목을 PASS/FAIL/NOT TESTED/BLOCKED/NOT APPLICABLE로 기록하고 운영 변경이 없음을 확인한다.

Commit: `test: 강연장 리허설 전체 흐름 검증`

## Rollback

- 코드와 문서는 기능 브랜치 커밋을 역순으로 일반 `git revert`한다.
- Preview migration은 기존 파일을 수정·삭제하거나 DB reset하지 않고 후속 보정 migration으로 함수 실행 권한을 철회하고 새 함수들을 제거한다.
- Preview 데이터는 초기화 RPC가 허용 조건을 만족할 때만 가짜 리허설 데이터를 정리한다.
- Production에는 migration·환경변수·배포를 적용하지 않으므로 Production rollback은 발생하지 않는다.

## 완료 조건

- 신규/수정 기능이 각 RED→GREEN 기록을 가진다.
- DB 잠금·권한·삭제 범위·설정 보존·rollback·Production 차단 테스트가 통과한다.
- `test:run`, `typecheck`, `lint`, `format:check`, `build`, 로컬 Playwright가 통과한다.
- 기존 Preview 연결이 안전 조건을 만족하면 Preview E2E와 QR 목적지를 검증한다.
- 불가능한 실제 스마트폰·프로젝터 확인은 Preview URL과 최소 수동 절차를 남긴다.
