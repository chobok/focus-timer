# Focus Tracker

뽀모도로 타이머로 집중 세션을 기록하고, 과목별 태그를 붙이고, 대시보드에서 패턴을 확인하는 풀스택 웹 앱입니다.

## 구조

```
focus-tracker/
├── backend/    Flask API (subjects, sessions, stats)
└── frontend/   React 앱 (Timer / History / Dashboard)
```

## 로컬에서 실행하기

### 1. 백엔드 (Flask)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

`http://localhost:5000` 에서 API가 실행됩니다.

### 2. 프론트엔드 (React)

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

`http://localhost:3000` 에서 앱이 열립니다. `.env`의 `REACT_APP_API_URL`이 백엔드 주소를 가리킵니다.

## API 엔드포인트

| Method | Endpoint          | 설명             |
| ------ | ----------------- | ---------------- |
| GET    | /subjects         | 모든 과목 목록   |
| POST   | /subjects         | 새 과목 생성     |
| DELETE | /subjects/<id>    | 과목 삭제        |
| GET    | /sessions         | 세션 목록(필터)  |
| POST   | /sessions         | 완료된 세션 저장 |
| DELETE | /sessions/<id>    | 세션 삭제        |
| GET    | /stats            | 대시보드 통계    |

## 배포

### 프론트엔드 (GitHub Pages)

```bash
npm run build
npm install -g gh-pages
gh-pages -d build
```

### 백엔드 (Railway)

`backend/railway.json`이 이미 포함되어 있습니다 (`gunicorn main:app`으로 시작).

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

배포 후 Railway가 발급한 URL을 프론트엔드의 `REACT_APP_API_URL`에 설정하세요.

## 기술 스택

- Frontend: React, React Router, Recharts
- Backend: Python (Flask, Flask-CORS, Gunicorn)
- 데이터: 현재는 인메모리 저장 (서버 재시작 시 초기화). 영구 저장이 필요하면 `backend/main.py`의 리스트를 SQLite 등으로 교체하세요.
