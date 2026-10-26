# 게임 아카이브 — GAME ARCHIVE

직접 만든 게임을 소개하고 플레이 페이지로 연결하는 레트로 게임 아카이브입니다.

## 현재 상태

스텔라아케이드를 진열장과 룰렛에 등록했습니다. 네온 서바이버는 룰렛 전용 보너스 게임으로 유지합니다. 두 항목의 룰렛 선택 확률은 동일합니다.

## 화면과 동작

- `index.html`: YES / NO 시작 로비. 방향키와 Enter로 이동합니다.
- `today.html`: 오늘의 게임 룰렛. 게임 등록 후 가속·감속 회전과 결과를 표시합니다.
- `games.html`: 목록과 미리보기. Enter / DETAILS로 상세 설명을 열고 하단 START GAME으로 실행합니다.
- `history.html`: 제작자·제작 의도·리소스 출처의 엔딩 크레딧. 일시정지·스킵·다시 보기를 지원합니다.
- 페이지 진입 로딩, 픽셀 타이틀, CRT 주사선과 선택·회전 효과음을 공유합니다. 배경 음악은 사용하지 않습니다.
- 본 사이트는 개인 창작·학습 목적의 비상업적 프로젝트입니다.

## 새 게임 등록

1. 실제 게임 화면을 `assets/images/`에 추가합니다.
2. `data/games.json` 배열에 아래 필드를 가진 게임 객체를 추가합니다.

| 필드 | 내용 |
| --- | --- |
| id | 게임 고유 ID |
| title / englishTitle | 표시 이름 / 영문 이름 |
| genre | 장르 |
| description / overview | 짧은 소개 / 상세 소개 |
| thumbnail | 썸네일 상대 경로 |
| url | 확인된 실제 실행 주소 또는 사이트 내부 상대 경로 |
| features | 조작법·게임 특징 문자열 배열 |
| firstDeployedAt | 확인된 최초 배포일 YYYY-MM-DD, 미확인은 null |
| rouletteOnly | true면 진열장에 표시하지 않고 룰렛에만 포함 (선택) |
| hidden | true면 진열장·룰렛에서 제외 (선택) |

등록 정보는 화면과 분리해 관리합니다. UI 변경은 `.agents/skills/game-archive-ui-consistency/SKILL.md`와 `AGENTS.md`를 따릅니다.

## 로컬 실행

기존 로컬 서버가 있으면 재사용합니다. 서버가 없을 때만 프로젝트 루트에서 실행합니다.

```sh
python3 -m http.server 4181 --bind 127.0.0.1
```

접속 주소: http://127.0.0.1:4181/

## GitHub Pages

- 저장소: https://github.com/bottlesun/game-archive
- 사이트: https://bottlesun.github.io/game-archive/
- Pages 소스는 GitHub Actions이며 `.github/workflows/pages.yml`로 배포합니다.
- 배포 대상은 HTML 5개와 css/, js/, data/, assets/입니다. 상대 경로를 유지합니다.
- 내부 인수인계 문서 `docs/monorepo-handoff.md`와 로컬 환경 파일은 Git 추적에서 제외합니다.
- 커밋·푸시는 각각 사전 승인을 받은 뒤 실행합니다.

## 네온 서바이버

`neon-survivor.html`에서 실행되는 자체 제작 60초 탄막 생존 게임입니다. 진열장에는 표시하지 않고 룰렛 전용 보너스 게임으로 유지합니다.

- 방향키·WASD·마우스·터치 드래그로 이동합니다.
- 보호막과 감속 아이템, 일시정지·재도전, 브라우저 최고 기록 저장을 지원합니다.
- 게임 코드와 그래픽은 `js/neon-survivor.js`와 자체 제작 Canvas·SVG로 구성합니다.

## 스텔라아케이드 · STELLARCADE

- 실행 주소: https://stellarcade.bottlesun3514.workers.dev/
- 스텔라이브 비공식·비상업 팬게임 선택 로비입니다.
- 현재 사카밤바스피스: 2분 동안 숫자 합이 10인 사각형을 찾는 퍼즐을 플레이할 수 있습니다.
- 썸네일은 해당 프로젝트의 `assets/brand/stellarcade-og-card.jpg`를 사용합니다. 게임 규칙은 프로젝트 README와 운영 배포 기록을 기준으로 등록했습니다.
