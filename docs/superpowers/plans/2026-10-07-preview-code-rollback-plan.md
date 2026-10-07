# Preview 기준 코드 복구 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지정한 Preview의 Production 기준 코드로 되돌리는 수동 GitHub Actions 경로를 만들고, 검토 가능한 복구 PR만 생성한다.

**Architecture:** 수동 `workflow_dispatch` Workflow가 저장소·기본 브랜치·확인 문구·기준 tag/SHA·main 조상 여부를 검사한다. 통과하면 helper가 보호 경로를 제외한 Git 추적 파일만 기준 commit으로 복원하고 복구 브랜치와 PR을 만든다. 자동 병합이나 Supabase/Vercel 접근은 추가하지 않는다.

**Tech Stack:** GitHub Actions, Git 2.x, GitHub CLI, Node.js 24, Vitest, Prettier

**Spec:** `docs/superpowers/specs/2026-10-07-preview-code-rollback-design.md`

## Global Constraints

- 복구 대상은 Git으로 관리되는 앱 코드와 정적 파일이다.
- Supabase 데이터·migration·설정, Vercel 환경변수·프로젝트 설정·도메인, 관리자 기능의 동작은 복구 작업에서 변경하지 않는다.
- 복구 과정에서 응모나 리허설 초기화 API를 호출하지 않는다.
- `supabase/**`, `.github/**`, `docs/**`, `context/**`, `study/**`, `AGENTS.md`, `tools/preview-rollback-policy.mjs`는 복구 변경에서 제외한다.
- 기본 브랜치에 직접 push하거나 복구 PR을 자동 병합하지 않는다.
- Workflow는 GitHub의 기본 `GITHUB_TOKEN`만 `contents: write`, `pull-requests: write`로 사용하고 Supabase·Vercel Secret을 읽지 않는다.
- 전체 검증은 `test:run`, `typecheck`, `lint`, `format:check`, `build`를 통과해야 한다.

## 시작 전 진입 조건

- Vercel 배포 ID `ZhXoth2XipPxT5zYZKqgPt699oLF`의 실제 소스 SHA가 Preview 후보 SHA `de4aebb6d0503d4d453911bf0bd68a1dde11fd87`와 같은지 독립 확인한다. 조회할 수 없거나 다르면 기준 SHA를 추정하지 않고 구현을 중단한다.
- PR #30이 별도 검토·병합되고 해당 앱 코드의 Production 배포가 확인된 후, 실제 Production 기준 commit에 `preview-baseline-2026-10-07` tag를 만든다.
- 이 구현 계획은 PR #30 병합, Production 배포, 기준 tag 생성, 복구 Workflow 실행을 포함하지 않는다. 기준 tag가 아직 없으면 코드 검증까지만 하고 수동 Workflow를 실행하지 않는다.

## 파일 구조

- Create: `.github/workflows/rollback-to-preview-baseline.yml` — 수동 실행 입력, 최소 권한, Git 복원, 브랜치 push, PR 생성.
- Create: `tools/preview-rollback-policy.mjs` — 실행 조건, tag/SHA/조상 검증, 안전한 restore pathspec 및 변경 목록 검사.
- Create: `tools/preview-rollback-policy.test.mjs` — 조건 실패와 임시 Git 저장소에서 복원·제외 동작 검증.
- Create: `docs/operations/preview-code-rollback.md` — 기준선 준비, Workflow 실행, PR 검토와 병합 절차.

## Review Focus

- 다른 저장소·브랜치 또는 틀린 확인 문구로 실행하면 변경 전에 중단한다 — Task 1의 context validation 테스트.
- 잘못된 SHA, tag/SHA 불일치, 또는 main의 조상이 아닌 기준 commit이면 중단한다 — Task 1의 SHA·ancestry 테스트.
- 기준 commit을 적용할 때 보호 경로는 현재 main 내용을 유지하고 앱 파일은 기준 상태로 복원한다 — Task 1의 임시 Git 저장소 통합 테스트.
- 복원할 변경이 없거나 보호 경로가 staged되면 브랜치와 PR을 만들지 않는다 — Task 1의 변경 목록 테스트와 Task 2의 호출 순서.
- 운영자는 복구 PR을 검토할 때까지 운영 코드가 바뀌지 않으며 Supabase/Vercel 설정·데이터가 그대로임을 확인할 수 있어야 한다 — Task 2의 직접 push·자동 병합·외부 Secret 미사용 구성, Task 3의 실행 안내.

---

### Task 1: 복구 조건과 파일 범위 검증기

**Files:**
- Create: `tools/preview-rollback-policy.test.mjs`
- Create: `tools/preview-rollback-policy.mjs`

**Interfaces:**
- Produces: `validateRollbackRequest(input: { repository: string, ref: string, confirmation: string, requestedSha: string, tagSha: string, isAncestor: boolean, runId: string }): { baselineSha: string, branchName: string }`
- Produces: `buildRestorePathspec(): string[]` — `.`와 일곱 보호 경로의 Git pathspec exclude 항목을 반환한다.
- Produces: `validateStagedPaths(paths: string[]): string[]` — 비어 있지 않은 허용 변경 파일 목록만 반환하며 빈 목록이나 보호 경로가 있으면 오류를 던진다.

- [ ] **Step 1: 실패 테스트를 먼저 작성한다**

  올바른 저장소 `yong-sung/kwater-prize-draw`, ref `refs/heads/main`, 확인 문구 `PREVIEW BASELINE 복구 PR 생성`, 같은 40자리 SHA, 조상 여부 true 입력은 통과해야 한다. 저장소·ref·확인 문구 오류, SHA 형식 오류·tag 불일치, 조상 여부 false는 각각 거부되어야 한다. 변경 목록 검사는 빈 목록과 보호 경로를 거부하고 일반 앱 파일을 허용해야 한다.

  임시 Git 저장소 통합 테스트는 기준 commit에 `src/app/page.tsx`를 만들고 후속 main commit에서 앱 파일과 보호 파일을 바꾼 뒤, helper의 pathspec으로 복원한다. 앱 파일은 기준 commit 내용이 되고 `supabase/**`, `.github/**`, `docs/**`, `context/**`, `study/**`, `AGENTS.md`, `tools/preview-rollback-policy.mjs`는 후속 main 내용이 남아야 한다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

  Run: `npm run test:run -- tools/preview-rollback-policy.test.mjs`  
  Expected: helper 모듈 부재로 FAIL.

- [ ] **Step 3: 정책 helper를 구현한다**

  `validateRollbackRequest`는 위 저장소·ref·확인 문구를 상수와 비교하고, 두 SHA가 40자리 hexadecimal이며 서로 같고 기준 commit이 main 조상일 때만 통과시킨다. 반환 branch 이름은 `rollback/preview-baseline-<runId>`로 제한한다. `buildRestorePathspec`는 `.` 뒤에 `:(exclude)supabase/**`, `:(exclude).github/**`, `:(exclude)docs/**`, `:(exclude)context/**`, `:(exclude)study/**`, `:(exclude)AGENTS.md`, `:(exclude)tools/preview-rollback-policy.mjs`를 반환한다. `validateStagedPaths`는 빈 목록 및 보호 경로 변경을 거부한다.

- [ ] **Step 4: 테스트를 다시 실행해 통과를 확인한다**

  Run: `npm run test:run -- tools/preview-rollback-policy.test.mjs`  
  Expected: context·SHA·ancestry·보호 경로 테스트 PASS.

- [ ] **Step 5: Task 1을 커밋한다**

  ```bash
  git add tools/preview-rollback-policy.mjs tools/preview-rollback-policy.test.mjs
  git commit -m "feat: 코드 복구 조건과 범위 검증 추가"
  ```

### Task 2: 수동 복구 PR Workflow

**Files:**
- Create: `.github/workflows/rollback-to-preview-baseline.yml`
- Modify: `tools/preview-rollback-policy.mjs`
- Modify: `tools/preview-rollback-policy.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `validateRollbackRequest`, `buildRestorePathspec`, `validateStagedPaths`.
- Produces: Actions 탭에서 기본 브랜치로만 수동 실행할 수 있는 복구 PR 생성 Workflow.

- [ ] **Step 1: Workflow가 요구하는 CLI 동작의 테스트를 추가한다**

  helper CLI가 GitHub 입력을 검사한 뒤 기준 SHA와 branch 이름만 output으로 내보내는지, staged 파일 목록이 비었으면 실패하는지 테스트한다. 외부 PR 생성이나 실제 저장소 push는 테스트에서 호출하지 않는다.

- [ ] **Step 2: RED를 확인한다**

  Run: `npm run test:run -- tools/preview-rollback-policy.test.mjs`  
  Expected: CLI 입력 처리 테스트가 helper의 미구현 동작으로 FAIL.

- [ ] **Step 3: helper CLI와 Workflow를 구현한다**

  `workflow_dispatch` 입력은 `confirmation`과 `baseline_sha` 두 개로 고정한다. checkout은 전체 Git 이력과 tag를 가져온다. helper는 `GITHUB_REPOSITORY`, `GITHUB_REF`, 입력값, `preview-baseline-2026-10-07` tag, checkout된 main을 확인하고 유효한 결과만 `GITHUB_OUTPUT`에 쓴다. Workflow는 검증이 성공한 뒤에만 복구 branch를 만들고 helper의 pathspec으로 staged restore를 수행한다. staged 경로 검증 성공 및 변경 존재 확인 후 해당 branch에만 push하고, `gh pr create --base main`으로 PR을 만든다. PR 본문에는 복구 범위, Preview 확인, 담당자 수동 검토·병합, 데이터·설정 미변경을 적는다.

  Workflow 권한은 `contents: write`, `pull-requests: write`만 선언한다. `GITHUB_TOKEN` 외의 Secret은 환경에 전달하지 않는다. main 직접 push, force push, auto-merge, Vercel 배포 API, Supabase API 호출은 넣지 않는다.

- [ ] **Step 4: helper 및 Workflow 구성을 검증한다**

  Run: `npm run test:run -- tools/preview-rollback-policy.test.mjs && npx prettier --check .github/workflows/rollback-to-preview-baseline.yml tools/preview-rollback-policy.mjs tools/preview-rollback-policy.test.mjs`  
  Expected: 테스트 PASS, Prettier가 Workflow와 helper 파일을 모두 정상 파싱.

- [ ] **Step 5: Task 2를 커밋한다**

  ```bash
  git add .github/workflows/rollback-to-preview-baseline.yml tools/preview-rollback-policy.mjs tools/preview-rollback-policy.test.mjs
  git commit -m "feat: Preview 기준 복구 PR workflow 추가"
  ```

### Task 3: 담당자 실행 안내와 저장소 검증

**Files:**
- Create: `docs/operations/preview-code-rollback.md`

**Interfaces:**
- Consumes: Task 2의 Workflow 입력 및 tag/SHA 검증 규칙.
- Produces: 새 담당자가 복구 PR을 안전하게 만들고 확인하는 한국어 운영 절차.

- [ ] **Step 1: 운영 절차 문서를 작성한다**

  문서에 (1) Vercel 배포 소스 SHA 확인, (2) PR #30 별도 검토·Production 배포 확인 후 기준 tag 생성, (3) Actions에서 기본 브랜치와 두 입력값 지정, (4) 생성 PR의 경로·CI·Preview 확인, (5) 담당자 승인 후 PR 병합, (6) 응모·추첨 데이터와 Supabase/Vercel 설정은 복원되지 않는다는 점을 순서대로 적는다. 미확정 SHA나 비밀값을 적지 않고 tag가 없거나 SHA가 맞지 않으면 중단하도록 명시한다.

- [ ] **Step 2: 전체 필수 검증을 실행한다**

  Run: `npm run test:run && npm run typecheck && npm run lint && npm run format:check && npm run build`  
  Expected: 다섯 명령 모두 종료 코드 0.

- [ ] **Step 3: 변경 범위와 위험 경계를 확인한다**

  `git diff --name-only`에서 위 파일 네 개만 변경되었는지 확인한다. Workflow에 Supabase/Vercel secret 참조, 직접 main push, 자동 병합, 외부 배포·데이터 호출이 없는지 검토한다. 기준 tag가 준비되지 않았다면 `workflow_dispatch`를 실행하지 않는다.

- [ ] **Step 4: Task 3을 커밋한다**

  ```bash
  git add docs/operations/preview-code-rollback.md
  git commit -m "docs: Preview 코드 복구 절차 추가"
  ```

## 실행하지 않는 작업

- PR #30 병합, Production 배포, baseline tag 생성·이동.
- 실제 복구 Workflow 실행, 복구 PR 병합, main 직접 변경.
- Supabase 응모·추첨·행사 데이터 변경, migration 실행, 관리자 API 호출.
- Vercel 환경변수·프로젝트 설정·도메인 변경 또는 배포 승격.

## 완료 조건

- 잘못된 저장소/ref/확인 문구/SHA/ancestry와 보호 파일 변경은 모두 거부된다.
- 임시 Git 저장소에서 앱 코드만 기준 commit으로 복원되고 지정 보호 경로가 유지된다.
- 수동 Workflow는 검증 성공 후 복구 branch와 검토 가능한 PR만 만들며 main을 직접 변경하거나 자동 병합하지 않는다.
- `test:run`, `typecheck`, `lint`, `format:check`, `build`가 모두 통과한다.
- 실제 기준선이 확인·태그되기 전에는 복구 실행이 발생하지 않는다.
