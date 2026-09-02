# SentinelAI FastAPI Backend

## Run locally

1. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
2. Start the API:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Available endpoints

- POST /api/v1/auth/register
- POST /api/v1/auth/token
- POST /api/v1/uploads/audio
- POST /api/v1/uploads/video
- POST /api/v1/live/camera
- POST /api/v1/predict
- GET /api/v1/history
- GET /health

> Note: A MongoDB instance is expected at mongodb://localhost:27017.
