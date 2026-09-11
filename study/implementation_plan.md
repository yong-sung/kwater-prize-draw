# K-water 경품추첨 구현계획

- 기준일: 2026-09-09
- 승인 설계: `docs/superpowers/specs/2026-09-09-prize-draw-web-design.md`
- 승인 구현계획: `docs/superpowers/plans/2026-09-09-prize-draw-web-implementation.md`
- 기준 선택: 기존 `study/implementation_plan.md`가 없어 더 최신인 승인 구현계획을 기준으로 생성

## 목적과 범위

행사 참석자의 개인정보를 안전하게 접수하고, 관리자 통제 아래 30개 경품을 공정하게 추첨·공개하는 웹 서비스를 단계별로 구축한다. 이번 실행 범위는 승인 구현계획의 Task 1인 프로젝트 기반과 개발 계약으로 한정한다.

## Context

`context/design-reference/`의 모바일 화면 참고 이미지 3개와 방울이 캐릭터 원본 2개를 읽기 전용 원본으로 보존한다.

## 기술 선택

Next.js App Router, TypeScript strict mode, Tailwind CSS, ESLint, Prettier, Vitest와 Testing Library, Playwright, npm, `src/` 구조 및 `@/*` 별칭을 사용한다. 이후 Task에서 Supabase, Zod, JOSE, bcryptjs 및 QR 코드를 사용한다.

## Task 1 구현 단계

1. 현재 폴더를 Git 및 npm 프로젝트로 초기화한다.
2. 런타임·개발·테스트 의존성과 npm 스크립트를 구성한다.
3. 환경변수 계약과 Git 제외 규칙을 작성한다.
4. 첫 화면 테스트를 먼저 실패시킨 뒤 최소 화면을 구현한다.
5. Windows용 `setup.ps1`, `verify.ps1`을 작성한다.
6. 테스트, typecheck, lint, formatting, production build를 검증한다.
7. 검증 기록과 변경이력을 작성하고 지정 메시지로 커밋한다.

## 데이터 변경과 배포

Task 1에는 데이터베이스 migration·seed와 배포가 없다. `.env.example`에는 자리표시자만 기록하며 실제 Secret을 저장하지 않는다.

## 검증 방법

`npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`를 모두 실행하고 결과를 `study/validation.md`에 기록한다.

## Rollback

Task 1 커밋을 일반 `git revert`로 되돌릴 수 있다. `context/`와 승인 문서는 변경하지 않는다.

## 후속 Task

Task 2 이후는 이번 실행 범위에서 제외하며 시작하지 않는다.

## Task 3 실행 계획 갱신

- 실행 범위: Supabase 스키마, RLS, 함수 권한, 원자적 추첨·대체 추첨·공개·결과 공유·만료 삭제 함수와 관련 테스트
- migration: 적용된 20260910003438_initial.sql과 20260911114700_task3_review_fixes.sql은 불변으로 보존하고, 최종 리뷰 보정은 20260911133000_task3_reveal_state_fix.sql에 추가한다. 운영 데이터와 seed는 사용하지 않는다.
- 원격 안전장치: 최소 권한 Management API로 project ref의 프로젝트명이 정확히 kwater-prize-draw-dev인지 확인한 뒤 transaction rollback dry-run과 공식 migration 적용 API를 실행한다. supabase link, db reset --linked는 사용하지 않는다.
- 검증 순서: GitHub Actions Ubuntu runner 로컬 migration·pgTAP, 전용 개발 프로젝트 식별·migration 이력·dry-run·적용, query API 원격 pgTAP·DB 계약, 타입 생성 API, Security/Performance Advisors, 전체 품질 검사와 Secret 검사
- 완료 조건: 모든 필수 검증 통과 후 Task 3 PR만 squash merge하며 Task 4는 시작하지 않는다.

### 환경 제약

현재 개발 PC는 nested virtualization이 비활성화된 Xen VM이므로 로컬 Docker와 WSL 2 기반 Supabase 실행이 불가능하다. Task 3 DB 검증은 GitHub Actions Ubuntu runner의 임시 로컬 DB와 운영에서 분리된 Supabase 개발 프로젝트에서 수행한다. 원격 pgTAP은 최소 권한 query API로 transaction 안에서 실행하고 rollback하며 운영 데이터는 사용하지 않는다.

### Rollback

코드 변경은 squash commit을 일반 git revert로 되돌린다. 원격 migration은 자동 삭제하거나 reset하지 않고 후속 보정 migration으로만 되돌린다. context 원본과 승인된 docs 문서는 수정하지 않는다.

## Task 4 실행 계획

- 실행 범위: 공용 관리자 비밀번호 검증, IP HMAC 기반 10분 실패 횟수 제한과 15분 차단, 8시간 관리자 JWT 세션, 로그인·로그아웃 Route Handler, 관리자 로그인 컴포넌트
- 보안 경계: 비밀번호와 IP 원문은 저장·로그·응답하지 않고, 서버 전용 환경변수와 admin_login_attempts만 사용한다. 세션 쿠키는 HttpOnly, SameSite=Strict, / 경로와 production Secure를 적용한다.
- 데이터 변경: Task 3의 admin_login_attempts를 그대로 사용하며 기존 migration을 수정하지 않는다. Task 4에는 신규 migration과 운영 데이터 변경이 없다.
- TDD 순서: 세션·속도 제한·로그인/로그아웃·UI 계약 테스트를 먼저 실패시키고, 최소 구현 후 전체 테스트와 API·화면 흐름을 검증한다.
- 완료 조건: Task 4 테스트, 전체 테스트, typecheck, ESLint, Prettier, production build, Secret 검사, 코드 리뷰와 CI 통과 후 Task 4 PR만 squash merge한다.

### Task 4 환경 제약과 Rollback

로컬 Docker는 Xen nested virtualization 제약으로 사용하지 않는다. 기존 스키마를 변경하지 않으므로 DB 검증이 필요하면 GitHub Actions Ubuntu runner를 사용한다. 코드 변경은 squash commit을 일반 git revert로 되돌리며 Task 3 migration과 context/, docs/ 원본은 변경하지 않는다.
