# MemoryCare NE — SIH MVP

Desktop/laptop-first cognitive support and memory assistance prototype for elderly users. This is a support/engagement tool, not a medical diagnostic system.

## Run on Windows

### 1. Backend
Open a terminal in this folder:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend: http://localhost:8000
API health: http://localhost:8000/api/health

### 2. Frontend
Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

The frontend also works without the backend by keeping demo data in localStorage; when the API is available, game results and newly added memories/reminders are synced to SQLite.

## Included MVP
- Patient dashboard
- Memory Match
- Sequence Recall
- Local result capture + SQLite API
- Rule-based cognitive trend/adaptive recommendation engine
- Progress charts
- Caregiver dashboard
- Memory assistant cues
- Daily reminders
- North-East India familiar examples

## Notes
- Android/Capacitor is intentionally not part of the MVP workflow.
- No external LLM/API key is required for the demo.
