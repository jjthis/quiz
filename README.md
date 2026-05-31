# Quiz Hub

원하는 주제의 4지선다 퀴즈를 만들고, 플레이하고, 랭킹을 기록할 수 있는 웹 앱입니다.

## 주요 기능

- 퀴즈 선택 및 문제 수 설정 (`5 / 10 / 20 / All`)
- 보기 클릭 즉시 정오답 피드백
- 자동 다음 문제(1초) + 수동 다음 버튼
- 퀴즈별 랭킹 등록 및 TOP 20 조회
- 퀴즈 생성 / 수정 / 삭제
- AI 문제 추천 (OpenRouter) — 주제·스타일 선택 후 추천 문항 추가
- 로컬 SQLite 파일(`data/rankings.db`) 기반 저장

## 내장 샘플 퀴즈

앱 최초 실행(또는 DB 초기화) 시 아래 3개 퀴즈가 자동으로 시드됩니다.

| ID | 제목 |
|---|---|
| `world-capitals` | 세계 수도 퀴즈 |
| `general-knowledge` | 상식 퀴즈 |
| `food-trivia` | 음식 퀴즈 |


## 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- SQLite (`better-sqlite3`)

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정 (선택 — AI 추천 사용 시)

`.env.local` 파일에 `OPENROUTER_API_KEY`를 설정하세요. `.env.example` 참고.

3. 개발 서버 실행

```bash
npm run dev
```

4. 브라우저 접속

`http://localhost:3000`

DB를 처음부터 다시 만들려면 `data/rankings.db`를 삭제한 뒤 서버를 재시작하세요.

## 페이지

- `/` — 퀴즈 선택 및 플레이
- `/create` — 새 퀴즈 만들기
- `/manage` — 퀴즈 목록, 수정, 삭제
- `/edit/[quizId]` — 퀴즈 수정

## API

- `GET/POST /api/quizzes` — 퀴즈 목록 / 생성
- `GET/PUT/DELETE /api/quizzes/[quizId]` — 퀴즈 조회 / 수정 / 삭제
- `GET/POST /api/quizzes/[quizId]/scores` — 퀴즈별 랭킹
- `POST /api/quizzes/recommend` — AI 문제 추천
- `GET/POST /api/rankings?quizId=` — 레거시 랭킹 API (하위 호환)
