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
