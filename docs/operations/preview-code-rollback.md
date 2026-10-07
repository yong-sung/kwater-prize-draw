# Preview 기준 코드 복구 절차

이 절차는 앱 코드와 정적 파일을 지정된 기준 commit으로 되돌리는 **검토용 PR**을 만듭니다. main은 PR을 담당자가 직접 병합하기 전까지 변경되지 않습니다.

## GitHub Actions의 PR 생성 권한

이 workflow는 기본 `GITHUB_TOKEN`으로 복구 branch를 push하고 PR을 엽니다. 저장소 **Settings → Actions → General → Workflow permissions**에서 **Allow GitHub Actions to create and approve pull requests**가 활성화되어 있어야 합니다. 저장소 설정은 이번 변경에서 바꾸지 않았습니다. workflow 자체는 `contents: write`와 `pull-requests: write`만 받고, PR 승인이나 병합은 실행하지 않습니다.

## 현재 준비 상태

기준 Preview의 소스 SHA는 `de4aebb6d0503d4d453911bf0bd68a1dde11fd87`로 확인했습니다. 다만 이 SHA를 가리키는 Production 기준 tag는 아직 준비되지 않았습니다. PR #30을 별도 검토·병합하고 해당 앱 코드가 Production에 배포된 것을 확인한 뒤에만 아래 실행 절차를 사용할 수 있습니다.

## 실행 전: Production 기준 tag 준비

1. PR #30을 검토하고 `main`에 병합합니다.
2. Vercel Production 배포의 소스와 Preview에서 확인한 앱 코드 트리가 일치하는지 확인합니다.
3. Production 배포에 실제 사용된 commit SHA를 GitHub에서 확인합니다. SHA를 추정하거나 Preview alias URL만 기준으로 삼지 않습니다.
4. 저장소 clone에서 다음처럼 고정 tag를 만듭니다. `<PRODUCTION_COMMIT_SHA>`를 확인된 전체 SHA로 바꿉니다.

   ```bash
   git fetch origin --tags
   git tag -a preview-baseline-2026-10-07 <PRODUCTION_COMMIT_SHA> -m "Production baseline matching approved Preview code"
   git push origin refs/tags/preview-baseline-2026-10-07
   ```

5. tag가 올바른 commit을 가리키고 그 commit이 `main`의 조상인지 확인합니다. tag를 옮기거나 같은 이름으로 다시 만들지 않습니다.

tag가 없거나 SHA·코드 트리가 맞지 않으면 복구 workflow를 실행하지 말고 원인을 먼저 확인합니다.

## 복구 PR 만들기

1. GitHub 저장소에서 **Actions → Preview 기준 코드 복구 PR 만들기 → Run workflow**를 엽니다.
2. 실행 branch로 `main`을 선택합니다.
3. `confirmation`에 아래 문구를 정확히 입력합니다.

   ```text
   PREVIEW BASELINE 복구 PR 생성
   ```

4. `baseline_sha`에 `preview-baseline-2026-10-07` tag가 가리키는 **전체 commit SHA**를 입력합니다.
5. **Run workflow**를 선택하고 실행이 끝날 때까지 기다립니다. 저장소·ref·확인 문구·tag/SHA·main 조상 검사가 실패하면 branch나 PR을 만들지 않고 중단됩니다. 변경할 파일이 없거나 main이 실행 중 이동한 경우에도 중단됩니다.

## 생성된 PR 확인 및 병합

1. Workflow가 출력한 복구 PR을 엽니다.
2. 변경 경로를 확인합니다. `supabase/**`, `.github/**`, `docs/**`, `context/**`, `study/**`, `AGENTS.md`, `tools/preview-rollback-policy.mjs`는 복구 대상에서 제외됩니다.
3. GitHub Actions 검사가 통과하고 Vercel Preview를 확인할 때까지 병합하지 않습니다.
4. 후임 담당자가 diff와 Preview를 검토·승인한 뒤 PR을 직접 병합합니다. Workflow는 main에 직접 push하거나 자동 병합하지 않습니다.
5. 잘못된 복구 PR을 병합했다면 해당 PR을 다시 revert하는 별도의 PR을 만듭니다.

## 복구되지 않는 항목

이 절차는 Supabase 응모자 개인정보, 추첨·공개 결과, 행사·경품 설정, 데이터베이스 migration과 설정, Vercel 환경변수·프로젝트 설정·도메인을 복구하지 않습니다. 복구 PR에서는 응모·초기화 API나 원격 Supabase/Vercel API를 호출하지 않습니다.

현재 Preview와 Production이 같은 Supabase 프로젝트를 사용하므로, 코드 복구 후에도 현재 데이터는 그대로 유지됩니다.

## 이번 구현에서 실행하지 않은 작업

PR #30 병합, Production 배포, baseline tag 생성, 복구 workflow 실행과 복구 PR 병합은 별도 운영 판단이 필요한 작업입니다. 위 준비 조건이 확인되기 전까지 복구 workflow를 실행하지 않습니다.
