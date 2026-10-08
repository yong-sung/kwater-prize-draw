# K-water 경품추첨

Next.js App Router 기반의 K-water 행사 경품추첨 서비스입니다.

## 정식 Preview 주소

현재 기준으로 사용할 정식 Preview는 아래 주소입니다. Vercel에서 Git 브랜치 `feat/auditorium-prize-reveal-display`에 연결된 별칭입니다.

- 참석자 화면: https://kwater-prize-draw-preview-git-feat-auditori-055e6e-week1profile.vercel.app/
- 강연장 발표 화면: https://kwater-prize-draw-preview-git-feat-auditori-055e6e-week1profile.vercel.app/display
- 관리자 화면: https://kwater-prize-draw-preview-git-feat-auditori-055e6e-week1profile.vercel.app/admin

아래 주소는 과거에 Vercel CLI로 만든 개별 배포본입니다. 현재 정식 Preview 확인에는 위 브랜치 별칭을 사용합니다.

- 이전 개별 배포 주소: https://kwater-prize-draw-preview-4lj2vz69k-week1profile.vercel.app/

## 로컬 실행

```powershell
.\setup.ps1
npm run dev
```

## 검증

```powershell
.\verify.ps1
```

실제 비밀값은 Git에 포함되지 않는 `.env.local`에서 관리하고, 필요한 변수명은 `.env.example`을 참고합니다.
