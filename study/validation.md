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

검증 실행: GitHub Actions 34562141710 (2026-09-11), branch task/3-supabase-ci

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
