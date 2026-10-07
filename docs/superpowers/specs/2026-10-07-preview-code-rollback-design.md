# Preview 기준 코드 복구 설계

- 작성일: 2026-10-07
- 상태: 사용자 검토 대기
- 대상 저장소: `yong-sung/kwater-prize-draw`
- 목적: 이후 디자인 변경이 잘못되었을 때 지정 Preview의 코드 상태로 되돌리는 검토 가능한 복구 경로를 마련한다.

## 사용자 결정과 범위

사용자는 지정 Preview를 기준으로 복구하기를 원하며, 이번 설계에서 응모·추첨 데이터는 복구하지 않고 그대로 유지하기로 했다.

복구 대상은 Git으로 관리되는 앱 코드와 정적 파일이다. Supabase 데이터·migration·설정, Vercel 환경변수·프로젝트 설정·도메인, 관리자 기능의 동작은 복구 작업에서 변경하지 않는다. 복구 과정에서 응모나 리허설 초기화 API를 호출하지 않는다.

## 기준 배포 후보

- Preview 별칭: `https://kwater-prize-draw-preview-git-feat-auditori-055e6e-week1profile.vercel.app/display`
- Vercel 배포 ID: `ZhXoth2XipPxT5zYZKqgPt699oLF`
- GitHub PR: #30, `feat/auditorium-prize-reveal-display`
- PR #30의 확인된 head 후보 SHA: `de4aebb6d0503d4d453911bf0bd68a1dde11fd87`
- 확인 당시 `main`: `9776b52fe41958389db681dd894844f647ca6498`
- PR #30은 확인 당시 미병합이다.

Vercel의 GitHub 알림이 제공한 배포 ID와 URL은 연결되어 있지만, Vercel API에서 배포의 소스 SHA를 독립 조회하지 못했다. 구현 전 배포 ID의 실제 커밋 SHA가 위 후보와 같은지 확인한다. 일치하지 않으면 기준 SHA를 임의로 사용하지 않고 작업을 중단한다.

Preview 브랜치 별칭은 다음 배포 때 다른 빌드를 가리킬 수 있으므로, URL 문자열이 아니라 확인된 커밋 SHA와 배포 ID를 복구 기준으로 사용한다.

## 제안 방식

### 기준점 고정

- 검증된 커밋 SHA를 가리키는 `preview-baseline-2026-10-07` Git tag를 만든다.
- Workflow는 태그가 예상 SHA와 일치할 때만 동작한다.
- PR #30이 아직 `main`에 포함되지 않은 상태에서는 복구 PR 생성을 거부한다. 기준 코드가 운영 기준 브랜치에 들어오기 전에 복구하면 기능 코드까지 새로 운영에 반영될 수 있기 때문이다.
- PR #30을 기준선으로 `main`에 반영하거나 Production에 배포하는 동작은 이 설계/구현에 포함하지 않는다.

### 복구 실행

수동 실행 전용 GitHub Actions workflow를 추가한다. 작업자는 기본 브랜치에서 실행하고 확인 입력란에 지정 문구를 직접 입력한다. Workflow는 다음 조건을 검사한다.

1. 요청 저장소와 실행 브랜치가 지정 값과 일치한다.
2. 확인 문구가 정확하다.
3. 기준 tag가 고정 SHA를 가리키고 기준 commit이 `main`의 조상이다.
4. Supabase·Vercel Secret 없이 코드만 처리한다.

조건을 통과하면 현재 `main`에서 복구 브랜치를 만들고, 기준 commit의 앱 소스와 정적 파일을 복원한 뒤 복구 PR을 연다. `main`에 직접 push하거나 자동 병합하지 않는다. 복구 PR에도 기존 Actions와 Vercel Preview 검사를 실행하고, 지정된 후임 담당자가 검토·병합한다. 병합 시 Vercel의 기존 Git 연동이 `main`을 배포한다.

복구 PR은 `supabase/**`, `.github/**`, `docs/**`, `context/**`, `study/**`, `AGENTS.md`를 덮어쓰지 않는다. 따라서 기준선 이후의 DB migration 소스, 승인 문서, 개발 규칙, 복구 Workflow 자체를 지우지 않는다.

## 대안과 선택 근거

- Vercel Instant Rollback: 기존 Production 배포로는 빠르게 되돌릴 수 있으나, 이 Preview 배포가 아직 Production에서 사용된 적이 없으므로 이 URL 자체를 즉시 롤백 대상으로 삼을 수 없다.
- Supabase 전체 복원: Preview URL에는 당시 DB 스냅샷이 연결되어 있지 않으며, 전체 DB 복원은 기준 이후 추가된 실제 응모 데이터를 잃게 할 수 있다. 이번에는 제외한다.
- 선택안: 기준 SHA를 검증하고 코드 복구 PR을 만드는 수동 GitHub Workflow. Production 변경 전 Preview와 필수 검사를 거치며, 데이터는 건드리지 않는다.

## 오류 처리와 복구 범위

- 잘못된 확인 입력, SHA 불일치, 기준선 미포함, 브랜치·저장소 불일치 시 작업을 중단하고 PR이나 배포를 만들지 않는다.
- Preview 검사 또는 GitHub Actions가 실패하면 PR은 병합하지 않는다.
- 복구 PR을 잘못 병합한 경우에는 해당 PR을 다시 revert하는 새 PR을 만든다.
- 이 절차는 응모 데이터, 추첨 결과, 행사 설정, 환경변수, Vercel 설정을 복원하지 않는다. 이 데이터나 설정이 잘못된 경우 별도의 백업·복구 절차가 필요하다.

## 테스트와 완료 조건

- 확인 문구·저장소·브랜치·고정 SHA·조상 조건 실패 시 Workflow가 중단되는지 테스트한다.
- 생성되는 복구 변경이 허용된 앱 소스·정적 파일에만 적용되고 제외 경로는 그대로인지 테스트한다.
- Workflow가 Supabase 데이터 변경이나 직접 `main` push를 하지 않는지 검사한다.
- 저장소의 필수 검증(`test:run`, `typecheck`, `lint`, `format:check`, `build`)을 실행한다.
- Preview 배포가 기준 코드와 일치하는지 확인하고, 응모·추첨 데이터를 변경하지 않았음을 확인한다.
