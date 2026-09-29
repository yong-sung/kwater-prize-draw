# 변경이력

## 2026-09-14 - Task 5·6 복구

- Task 5 PR #3을 실제 확인 후 `8b1d2e7`로 main에 squash merge했다.
- 최신 main에서 Task 6 복구 브랜치를 만들고 UI 고유 변경만 재구성했다.
- 참석자 화면을 `/` Route에 연결하고 방울이 이미지를 `next/image`로 전환했다.
- 전체 86개 테스트, 정적 검사, production build와 3개 viewport Playwright 흐름을 통과했다.
- Task 7은 시작하지 않았다.

## 2026-09-11 - Task 4

- bcrypt 관리자 비밀번호 검증, 8시간 HS256 관리자 JWT와 HttpOnly·SameSite Strict 세션 쿠키, 로그인·로그아웃 Route Handler를 추가했다.
- IP 원문 대신 HMAC-SHA-256 식별자를 저장하고 10분 내 5회 실패 시 15분 차단하며 성공 시 기록을 삭제하도록 구현했다.
- 병렬 실패의 lost update를 차단하는 SECURITY DEFINER 원자 함수를 새 migration으로 추가하고 service_role에만 실행 권한을 부여했다.
- Vercel 공식 전달 헤더를 우선하고 IPv4·IPv6 주소를 검증·정규화해 임의 헤더 회전에 의한 제한 우회를 차단했다.
- 비밀번호 입력, 오류와 남은 차단 시간을 제공하는 반응형 관리자 로그인 컴포넌트를 추가했다.
- Ubuntu runner에서 local pgTAP 119개와 로그인 제한 DB 통합 테스트 2개를 실행하고 전용 개발 프로젝트에 migration을 적용했다.
- context/, docs/와 Task 3 migration을 변경하지 않았고 Task 5 기능은 시작하지 않았다.

## 2026-09-11 - Task 3

- 행사·경품·참석자·추첨 결과·공개 상태·감사 및 관리자 로그인 시도 스키마와 제약·인덱스·RLS를 초기 migration으로 추가했다.
- 원자적 추첨, 대체 추첨, 순차 공개, 결과 공개, 7일 만료 삭제 SECURITY DEFINER 함수와 최소 실행 권한을 추가했다.
- DB 계약과 함수 시나리오를 검증하는 pgTAP 116개 assertion 및 TypeScript 계약 테스트를 추가했다.
- 초기 migration은 불변으로 유지하고 교차 행사 결과 참조와 후보 없는 대체 추첨의 공개 수 정합성을 보장하는 보정 migration을 추가했다.
- 적용된 migration을 변경하지 않고 후보 없는 대체 추첨의 공개 완료 상태를 유지하는 후속 보정 migration을 추가했다.
- supabase link를 제거하고 전용 개발 프로젝트만 확인하는 최소 권한 Management API CI로 교체했다.
- 공식 migration/query/types/advisors API를 통해 원격 migration, rollback pgTAP, RLS·실제 역할 권한, 생성 타입과 Advisors를 검증했다.
- migration 이름·고정 원격 version·상세 SQL을 함께 비교해 중복 적용을 차단하고, 원격 단계의 Secret 범위를 최소화하며 CI Secret·Git 추적 대상 검사를 추가했다.
- SQL 비교에서 문자열 리터럴 내부 공백을 보존하고 Supabase 로컬 기동 로그를 억제해 CI 로그 위생을 보강했다.
- GitHub Actions Ubuntu runner로 로컬 Docker 검증을 수행해 nested virtualization이 비활성화된 Xen 개발 PC 제약을 분리했다.
- 운영 데이터와 실제 개인정보를 사용하지 않았고 context/, docs/ 원본을 변경하지 않았다.

## 2026-09-10 - Task 2

- 행사 상태와 경품 코드 타입, 허용 상태 전환 규칙을 추가했다.
- 참석자 성명·연락처·소속부서·개인정보 동의·행사 접근 토큰 검증과 연락처 정규화를 추가했다.
- AES-256-GCM 개인정보 암호화·복호화와 연락처·접근 토큰 HMAC-SHA-256 해시를 추가했다.
- 잘못된 키 길이, 암호문 형식, 인증 태그 및 암호문 변조 거부 테스트를 추가했다.
- Task 3의 DB, API, UI, 인증 기능은 구현하지 않았다.

## 2026-09-09 - Task 1

- 현재 폴더에 Next.js App Router 프로젝트 기반을 구성했다.
- 개발·테스트·품질검사 계약과 Windows 자동화 스크립트를 추가했다.
- 환경변수 자리표시자와 Git 제외 규칙을 추가했다.
- Task 2 이후의 기능은 구현하지 않았다.

## Task 7

- 관리자 추첨 및 대체 추첨 API와 불변식 검증을 추가했다.
- 인증, 상태 검증, 안전한 오류 응답 및 개인정보 비노출을 단위 테스트로 검증했다.

## Task 8 최종화

- 관리자 대시보드와 운영 API UI 검증을 완료했다.
- stale 개발 서버 원인을 확인하고 production Playwright 검증을 통과시켰다.

## 2026-09-29 - 강연장 리허설 준비

- 강연장 화면의 깨진 한국어 문구를 복구했다.
- 관리자 CLOSED → OPEN 응모 재개 버튼과 원자 상태 전환 RPC를 추가했다.
- 실제 Supabase URL project ref까지 확인하는 Preview 전용 초기화 guard/API/UI를 추가했다.
- 응모·상태 전환·초기화가 동일 행사 advisory lock을 사용하도록 migration과 미실행 pgTAP 계약을 추가했다.
- 리허설 초기화가 개인정보·추첨·공개·기존 감사 기록을 삭제하고 행사·경품 설정을 보존하도록 SQL을 작성했다.

### 2026-09-29 - 최종 리뷰 보정

- purge_expired_events의 잠금 순서를 행사별 advisory lock 후 행사 행 잠금으로 변경하고, 잠금 뒤 PUBLISHED 상태와 만료 시각을 다시 확인하도록 수정했다.
- 초기화와 cron 만료 삭제의 잠금 순서가 동일함을 확인하는 정적 회귀 테스트를 추가했다.
- 관리자 Playwright mock의 미인증 응답을 바로잡은 상태에서 Chromium 3개 뷰포트를 재검증했다.
- DB와 Preview 검증은 실행 조건이 없어 BLOCKED로 유지하고 Production에는 변경을 적용하지 않았다.
