# 강연장 리허설 준비 설계

- 작성일: 2026-09-28
- 기준 브랜치: `origin/main` (`e48ed93`)
- 목적: 이번 경품추첨 행사를 Preview에서 반복 리허설하고 실제 강연장 QR 접속까지 검증할 수 있는 상태를 만든다.

## 범위

강연장 화면의 깨진 한국어 문구, 관리자 응모 재개, Preview 전용 리허설 초기화, 응모부터 초기화까지의 통합 흐름을 구현하고 검증한다. 다중 행사 플랫폼, 장기 이력 관리, Production 초기화와 Production 배포는 제외한다.

## 기존 작업 보호

- 최신 `origin/main`에서 분리한 `feature/auditorium-rehearsal-ready` 작업트리에서 수행한다.
- 원래 작업트리의 `.gitignore`, `AGENTS.md`, `.worktrees/`, `context/`, `docs/`, `display-diagnostic.png`는 변경하지 않는다.
- 로컬 `.gitignore` 추가분은 원격 규칙과 중복되어 가져오지 않는다.
- 로컬 `AGENTS.md`의 Next.js 규칙만 새 작업트리에 반영한다.
- 원본 자료와 개인정보는 테스트 또는 배포로 전송하지 않는다.

## 관리자 응모 재개

관리자 대시보드는 `CLOSED`일 때만 `응모 재개`를 활성화한다. 기존 `PATCH /api/admin/event`와 `CLOSED → OPEN` 규칙을 사용하고, 서버에서 현재 상태를 다시 검증한다. `DRAWN` 이후에는 재개를 거부한다.

## Preview 전용 리허설 초기화

관리자 위험 작업 영역에서 행사명과 `리허설 초기화` 확인 문구를 입력해야 한다. API는 다음 조건을 모두 만족해야 RPC를 호출한다.

- 유효한 관리자 세션
- `VERCEL_ENV === "preview"` 또는 명시적으로 허용한 로컬 테스트 환경
- `ALLOW_REHEARSAL_RESET === "true"`
- `SUPABASE_PROJECT_ID`와 `REHEARSAL_ALLOWED_SUPABASE_PROJECT_ID`가 모두 존재하고 정확히 일치
- `VERCEL_ENV === "production"`이면 다른 조건과 무관하게 거부
- 요청의 행사 ID, 행사명, 확인 문구가 현재 DB 값과 일치

환경변수 누락·불일치·Production에서는 `403 REHEARSAL_RESET_DISABLED`로 실패한다.

서비스 전용 PostgreSQL 함수는 행사 행을 잠근 뒤 한 트랜잭션에서 추첨 결과, 공개 진행 상태, 참석자 개인정보를 삭제한다. 개인정보가 포함될 수 있는 기존 감사 기록의 `reason`과 `detail`은 삭제 또는 비식별화한다. 행사 상태와 공개·삭제 예약 필드는 `SETUP` 기준으로 되돌리되 행사와 경품 설정은 유지한다. 마지막에 개인정보 없는 `REHEARSAL_RESET` 이력만 남긴다.

함수 실행 권한은 `service_role`에만 부여하며 `public`, `anon`, `authenticated`에서는 철회한다. 입력과 반환값에도 개인정보를 포함하지 않는다.

## 강연장 화면과 복원

깨진 로딩·오류 문구를 정상 한국어로 교체한다. QR은 Preview origin의 `/`를 가리킨다. 강연장 전용 인증과 공개 API를 유지하고, 서버 상태를 다시 조회하여 새로고침 후 공개 위치를 복원한다. Enter 한 번당 한 명만 공개하며 처리 중 추가 입력은 무시한다.

## 검증

TDD로 다음을 검증한다.

- 한국어 문구 회귀
- `CLOSED → OPEN` 버튼과 API, 다른 상태 거부
- 초기화 환경 판정의 Preview 허용과 누락·불일치·Production 거부
- 관리자 인증과 확인 정보 불일치 거부
- 초기화 RPC와 안전한 오류 응답
- DB 잠금, 삭제 범위, 설정 보존, 권한 철회, 비식별 감사 기록
- 관리자 로그인, QR, 응모, 중복 차단, 마감·재개, 추첨, Enter 공개, 새로고침 복원, 대체 추첨, 결과 공유, 참석자 결과 확인, 초기화와 재시작의 전체 흐름

전체 `test:run`, `typecheck`, `lint`, `format:check`, `build`와 Playwright를 통과한 뒤 Preview에서 데스크톱·모바일 화면과 실제 QR 목적지를 확인한다. 운영 Supabase 데이터·환경변수와 Production 배포는 변경하지 않는다.

## 실패와 rollback

환경 판정 실패는 RPC 전에 종료한다. DB 작업 중 실패하면 트랜잭션 전체를 rollback한다. migration은 삭제하거나 DB reset하지 않고 후속 보정 migration으로 되돌린다. 코드는 기능 브랜치 커밋을 일반 `git revert`로 되돌린다.

## 완료 조건

- 요청된 네 기능과 안전장치가 자동 테스트를 통과한다.
- Preview Supabase에서 전체 흐름을 반복 실행한다.
- 실제 QR이 Preview 참석자 페이지로 연결된다.
- Production 데이터·환경변수·배포에는 변경이 없다.
