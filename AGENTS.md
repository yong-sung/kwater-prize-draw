# K-water 경품추첨 개발 규칙

- 모든 설명, 문서, 화면 문구는 한국어를 기본으로 작성한다.
- `context/`의 원본 자료는 읽기 전용으로 취급하며 수정하거나 덮어쓰지 않는다.
- `study/implementation_plan.md`와 `docs/superpowers/`의 승인된 설계·구현 계획을 우선한다.
- Task를 하나씩 TDD로 수행하고 범위를 임의로 확장하지 않는다.
- 개인정보 원문, 비밀키, 관리자 비밀번호를 코드·로그·Git에 남기지 않는다.
- 추첨과 상태 변경은 서버 및 데이터베이스 트랜잭션에서만 실행한다.
- 작업 완료 전 `test:run`, `typecheck`, `lint`, `format:check`, `build`를 실행한다.
- 기존 사용자 변경을 덮어쓰거나 되돌리지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
