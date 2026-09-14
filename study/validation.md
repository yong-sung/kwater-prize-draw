# 검증 기록

## Task 1

| 항목                           | 상태           | 실제 결과                                                 |
| ------------------------------ | -------------- | --------------------------------------------------------- |
| TDD RED                        | PASS           | 제목이 없는 초기 화면에서 테스트 1건이 기대한 사유로 실패 |
| TDD GREEN / `npm run test:run` | PASS           | 테스트 파일 1개, 테스트 1개 통과                          |
| `npm run typecheck`            | PASS           | TypeScript 오류 없음                                      |
| `npm run lint`                 | PASS           | ESLint 오류 및 경고 없음                                  |
| `npm run format:check`         | PASS           | 검사 대상 전체가 Prettier 형식 준수                       |
| `npm run build`                | PASS           | Next.js 16.3.4 production build 및 정적 `/` 생성 성공     |
| 보안·Secret 점검               | PASS           | `.env.example`에 변수명과 자리표시자만 존재               |
| `context/` 원본 보존           | PASS           | 원본 이미지 5개 수정 없음                                 |
| migration / seed               | NOT APPLICABLE | Task 1 범위에 데이터베이스 변경 없음                      |
| 화면 E2E                       | NOT TESTED     | Playwright 브라우저 흐름은 후속 Task 범위                 |

최초 의존성 설치 중 시스템 드라이브 공간 부족이 발생해 재생성 가능한 npm 캐시만 비운 뒤 재시도했으며, 최종 설치 감사 결과 취약점은 0건이었다.

## Task 2

| 항목                      | 상태           | 실제 결과                                                   |
| ------------------------- | -------------- | ----------------------------------------------------------- |
| TDD RED                   | PASS           | 구현 모듈 3개가 없어 관련 테스트 스위트 3개가 예상대로 실패 |
| Task 2 단위 테스트        | PASS           | 상태 전환·입력 검증·PII 보호 테스트 40개 통과               |
| 전체 단위 테스트          | PASS           | 테스트 파일 4개, 테스트 41개 통과                           |
| `npm run typecheck`       | PASS           | TypeScript 오류 없음                                        |
| `npm run lint`            | PASS           | ESLint 오류 및 경고 없음                                    |
| `npm run format:check`    | PASS           | 검사 대상 전체가 Prettier 형식 준수                         |
| `npm run build`           | PASS           | Next.js 16.3.4 production build 및 정적 `/` 생성 성공       |
| 보안·Secret 점검          | PASS           | 테스트에 명백한 더미값만 사용하고 원문·키를 출력하지 않음   |
| Playwright E2E            | NOT TESTED     | Task 2 범위에서 제외                                        |
| Supabase migration / seed | NOT APPLICABLE | Task 2 범위에 데이터베이스 변경 없음                        |

연락처 정규화는 하이픈과 공백만 제거한다. 문자 등 다른 문자를 숫자와 함께 제거하지 않고 검증에서 거부해 잘못된 번호가 정상 번호로 바뀌지 않도록 했다.

## Task 3

검증 실행: GitHub Actions 34562680364 (2026-09-11), branch task/3-supabase-ci

| 항목                           | 상태    | 실제 결과                                                                                                    |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| TDD RED                        | PASS    | 초기 계약 2건과 최종 리뷰 보정 계약 3건이 구현 전 예상 이유로 실패                                           |
| GitHub Actions local migration | PASS    | Ubuntu runner의 깨끗한 Supabase 로컬 DB에 초기·보정 migration 적용                                           |
| local pgTAP                    | PASS    | 116/116 assertion 통과                                                                                       |
| 대상 프로젝트 식별             | PASS    | project ref 형식 검증 후 프로젝트명 kwater-prize-draw-dev 일치 확인                                          |
| 원격 migration dry-run         | PASS    | query API transaction에서 적용 전 migration SQL 실행 후 rollback                                             |
| 원격 migration 적용            | PASS    | 공식 migration API로 초기·Task 3 리뷰 보정 migration 3개 적용                                                |
| 원격 migration 이력            | PASS    | 20260910003438→20260911021758, 20260911114700→20260911025534, 20260911133000→20260911042952 및 SQL 일치      |
| 원격 pgTAP                     | PASS    | query API transaction에서 실제 ok 행 116개와 1..116을 계수하고 rollback                                      |
| RLS·제약·인덱스·함수 권한      | PASS    | 테이블, 유효 제약, 인덱스, RLS, 정책 부재, SECURITY DEFINER 빈 search_path, anon/authenticated 권한 차단 8/8 |
| TypeScript 타입                | PASS    | 공식 타입 API 생성, UTF-8·TypeScript 구문·저장소 파일 일치                                                   |
| Security Advisors              | PASS    | 7건, 모두 INFO                                                                                               |
| Performance Advisors           | PASS    | 3건, 모두 INFO                                                                                               |
| 전체 단위 테스트               | PASS    | 테스트 파일 7개, 테스트 52개 통과                                                                            |
| Typecheck                      | PASS    | TypeScript 오류 없음                                                                                         |
| ESLint                         | PASS    | 오류 및 경고 없음                                                                                            |
| Prettier                       | PASS    | 검사 대상 전체 형식 준수                                                                                     |
| Production build               | PASS    | Next.js production build 성공                                                                                |
| Secret·추적 대상 검사          | PASS    | Secret 값 미출력, .env.local·.supabase/·비밀번호·API key 미추적                                              |
| context/·docs/ 원본 보존       | PASS    | untracked 원본 상태를 유지하고 Task 3 commit에서 제외                                                        |
| 로컬 Windows DB 검증           | BLOCKED | nested virtualization이 비활성화된 Xen VM이라 Docker/WSL 2 실행 불가                                         |

supabase link는 API key, Auth, Storage, Realtime, 네트워크와 pooler 설정까지 추가 조회해 Scoped Token의 범위를 벗어나므로 제거했다. 프로젝트 조회, migration, query, types, advisors의 공식 Management API만 사용했다. migration API가 제출 버전을 직접 지정하지 않으므로 로컬 파일명과 고정된 원격 version을 함께 검증하고, 상세 API의 SQL을 문자열 리터럴 내부 공백을 보존하며 정규화해 로컬 파일과 일치하는지 확인했다. 코드 리뷰에서 발견한 교차 행사 결과 참조, 후보 없는 대체 추첨의 공개 수·상태 정합성, 실제 anon/authenticated 역할 권한, CI Secret 범위·로그와 추적 대상 검사를 보정했다. 샌드박스 ACL로 일반 파일 도구가 실패한 경우 승인된 workspace 범위에서 patch 전용 실행 경로를 사용했으며 프로젝트 파일 생성·수정과 검증은 정상 완료했다.

## Task 4

검증 실행: GitHub Actions 34568449898 (2026-09-11), branch task/4-admin-auth

| 항목                                 | 상태    | 실제 결과                                                                                                |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| TDD RED                              | PASS    | 세션·제한·API·UI 모듈 부재로 4개 suite가 예상대로 실패했고, workflow 손상 회귀 계약도 기대한 이유로 실패 |
| Task 4 단위·계약 테스트              | PASS    | 세션, 로그인 제한, login/logout API, 관리자 로그인 UI와 workflow 계약 22개 통과                          |
| 전체 단위 테스트                     | PASS    | 로컬 70개 통과, DB 통합 2개는 환경 조건으로 skip                                                         |
| Ubuntu local migration               | PASS    | 깨끗한 Supabase DB에 Task 3 migration 3개와 Task 4 migration 적용                                        |
| local pgTAP                          | PASS    | 119/119 assertion 통과                                                                                   |
| 로그인 제한 DB 통합                  | PASS    | 순차 누적·삭제와 병렬 5회 원자 누적 2개 통과                                                             |
| 대상 프로젝트 식별                   | PASS    | 전용 개발 프로젝트 `kwater-prize-draw-dev` 일치 후에만 원격 변경                                         |
| 원격 migration dry-run·적용          | PASS    | 20260911170000 dry-run 후 적용, 원격 version 20260911060930과 상세 SQL 일치                              |
| 원격 pgTAP·DB 권한                   | PASS    | 119/119, RLS·제약·인덱스·함수 권한 8/8                                                                   |
| 생성 TypeScript 타입                 | PASS    | 공식 API 생성 artifact의 UTF-8·구문을 확인하고 함수 타입 반영                                            |
| Security / Performance Advisors      | PASS    | security 7건 INFO, performance 3건 INFO; 차단 경고 없음                                                  |
| Typecheck·ESLint·Prettier·build      | PASS    | 오류·경고 없이 통과, login/logout 동적 Route Handler build 확인                                          |
| API·화면 동작                        | PASS    | 200/401/429/503, 쿠키 속성, 남은 차단시간 UI를 검증하고 데스크톱·모바일에서 입력·오류·overflow 확인      |
| Secret·민감 파일                     | PASS    | 실제 Secret 미출력·미추적, `.env.local`·`.supabase/` 미추적                                              |
| context/·docs/·Task 3 migration 보존 | PASS    | 미추적 원본을 commit에서 제외하고 기존 migration 3개 diff 없음                                           |
| 로컬 Windows DB                      | BLOCKED | nested virtualization이 비활성화된 Xen VM 제약; Ubuntu runner로 대체 검증                                |

첫 CI는 모든 로컬·원격 DB 검증과 Advisors를 통과한 뒤 생성 타입 차이를 의도대로 차단했다. 공식 타입 artifact와 원격 migration version을 저장소 계약에 반영한 후 CI를 재실행한다. 코드 리뷰의 원자성 HIGH, workflow 구문 HIGH, 신뢰 프록시 IP MEDIUM을 모두 수정했다. Vercel에서는 공식 `x-vercel-forwarded-for` 값을 우선하고 주소를 IPv4/IPv6로 검증·정규화한다.

## Task 5·6 복구 실제 검증

| 항목                 | 상태       | 실제 증거                                                                                                       |
| -------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Task 5 기준·범위     | PASS       | main 기준 API 6개 파일 커밋 `016bee9` 확인                                                                      |
| Task 5 API·전체 품질 | PASS       | API 10개 및 전체 86개 테스트, typecheck·ESLint·Prettier·build 통과                                              |
| Task 5 PR·병합       | PASS       | PR #3, https://github.com/yong-sung/kwater-prize-draw/pull/3, squash `8b1d2e7a0c674ca41772c2c6ca722b6b687101db` |
| Task 6 계보·Route    | PASS       | 최신 main에서 복구 브랜치 생성, `/`에 ParticipantApp 연결                                                       |
| Task 6 UI·브라우저   | PASS       | 전체 86개 통과; Playwright 375×812, 390×844, 1440×900 응모·WAITING 및 overflow 없음                             |
| 이미지·원본 경계     | PASS       | `public/images` 2개 추적, context/docs 미변경·미커밋                                                            |
| 원격 DB 상태별 화면  | NOT TESTED | 운영 데이터 없이 mock API로 UI 검증; Task 7 미시작                                                              |

기존 Task 6 브랜치의 Task 5 선행 커밋과 context/docs 포함 상태를 확인했으며, 최신 main 기반 복구 브랜치에는 UI와 공개 이미지 자산만 재구성했다. 사용자 변경은 보존 커밋 `c7fc717`에 남겼다.
