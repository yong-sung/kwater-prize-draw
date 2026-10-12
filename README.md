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

## 발표 화면 디자인 미리보기

로컬 서버 실행 후 `/display/preview`에서 경품별 15명의 가상 명단으로 시안을 확인할 수 있습니다. 이 화면은 추첨 API를 호출하지 않습니다. 실제 발표 화면 `/display`는 기존 인증과 순차 공개 기능을 사용하며, 인원수와 이름·부서는 공개된 데이터로 표시합니다.

배경·카드·명단·문구는 HTML/CSS, 물결은 SVG, 캐릭터와 경품은 개별 이미지입니다. 방울이 2종과 키보드 이미지는 첨부 참고자료를 바탕으로 생성한 임시 에셋이며, 정확한 원본 제품 사진·공식 캐릭터와 차이가 있습니다. 제목은 설치된 시스템 글꼴을 사용하므로 시안의 글꼴과 다를 수 있습니다. 에셋과 생성 프롬프트는 `public/images/display/README.md`에 정리했습니다.

## 검증 명령

```powershell
.\verify.ps1
```

실제 비밀값은 Git에 포함되지 않는 `.env.local`에서 관리하고, 필요한 변수명은 `.env.example`을 참고합니다.
