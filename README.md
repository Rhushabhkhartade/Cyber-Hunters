# 🛡️ SentinelAI — Cyber Threat Detection Platform

A full-stack AI-powered cyber threat detection platform featuring real-time deepfake detection, social engineering analysis, and multi-channel phishing/scam detection.

## Features

### 🎙️ Audio Deepfake Scanner
- Upload audio files (WAV, MP3, FLAC, OGG, M4A, AAC)
- Heuristic deepfake authenticity analysis
- Social engineering transcript analysis
- Combined risk score with evidence

### 🎬 Video Scanner
- Upload video files for synthetic content detection

### 📡 Live Stream Inspector
- Real-time audio chunk analysis
- Live social engineering detection during calls
- Session-based threat tracking

### 🔍 Multi-Channel Threat Scanner *(New)*
- **📧 Email Phishing Detection** — sender analysis, urgency patterns, credential/OTP requests, impersonation, embedded URL extraction
- **🌐 URL Heuristic Analysis** — IP-based URLs, lookalike domains, suspicious TLDs, phishing path keywords, obfuscation (no browsing required)
- **📱 SMS Smishing Detection** — KYC scams, banking fraud, OTP requests, delivery/prize/investment scams, embedded URL extraction
- **Cross-Channel Correlation** — combined threat score when URLs are found inside emails/SMS

### 📊 Ops Dashboard
- System metrics overview
- Weekly threat interceptions chart
- Threat vector breakdown

### 📋 Risk Report Compiler
- Generate corporate security audit summaries

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + TailwindCSS v4 |
| UI Icons | Lucide React |
| Fonts | Orbitron, Inter, Rajdhani (Google Fonts) |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (Motor async driver) |
| Auth | JWT (python-jose) + OAuth2 |
| Storage | Supabase (optional) |

---

## Project Structure

```
sentinel-ai/
├── src/                        # Frontend source
│   ├── api/
│   │   └── backend.js          # API client (auth + all endpoints)
│   ├── components/
│   │   ├── CyberBackground.jsx
│   │   ├── common/
│   │   └── layout/
│   │       └── AppShell.jsx    # Navigation + chat assistant
│   ├── config/
│   │   └── navigation.js
│   ├── hooks/
│   │   ├── useChatAssistant.js
│   │   ├── useLiveAudioStream.js
│   │   └── useUploadScanner.js
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Features.jsx
│   │   ├── About.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RiskReport.jsx
│   │   ├── UploadAudio.jsx
│   │   ├── UploadVideo.jsx
│   │   ├── LiveDetection.jsx
│   │   ├── ThreatScanner.jsx   # Multi-channel phishing scanner
│   │   └── Contact.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── history.py
│   │   │   ├── live.py
│   │   │   ├── predictions.py
│   │   │   ├── uploads.py
│   │   │   └── threat.py       # POST /threat/email|url|sms
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── exceptions.py
│   │   ├── db/
│   │   │   └── mongodb.py
│   │   ├── schemas/
│   │   │   ├── analysis.py
│   │   │   └── auth.py
│   │   ├── services/
│   │   │   ├── audio_analysis_service.py
│   │   │   ├── auth_service.py
│   │   │   ├── live_stream_service.py
│   │   │   ├── risk_engine.py
│   │   │   ├── social_engineering_service.py
│   │   │   ├── transcription_service.py
│   │   │   └── threat_scanner_service.py  # New: Email/URL/SMS heuristics
│   │   ├── main.py
│   │   └── supabase_client.py
│   ├── requirements.txt
│   └── .env.example            # Copy to .env and fill in your values
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (or local MongoDB)

### Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, SECRET_KEY, etc.

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API runs at: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/token` | Login / get JWT token |
| `GET`  | `/api/v1/auth/me` | Current user profile |
| `POST` | `/api/v1/uploads/audio` | Upload audio for deepfake scan |
| `POST` | `/api/v1/uploads/video` | Upload video |
| `POST` | `/api/v1/live/camera` | Start live session |
| `POST` | `/api/v1/live/audio` | Send live audio chunk |
| `POST` | `/api/v1/live/session/stop` | End live session |
| `GET`  | `/api/v1/history` | Scan history |
| `POST` | `/api/v1/threat/email` | Analyze email for phishing |
| `POST` | `/api/v1/threat/url` | Analyze URL (heuristic, no browsing) |
| `POST` | `/api/v1/threat/sms` | Analyze SMS for scam patterns |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```
SECRET_KEY=<strong-random-secret>
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
MONGO_DB_NAME=sentinelai
DEV_AUTH_ENABLED=true        # set false in production
```

**Never commit your `.env` file.**

---

## Security Notes

- `.env` is excluded from Git via `.gitignore`
- URL analysis inspects structure only — never fetches/executes target URLs
- All threat detection is heuristic-based (not trained ML)
- JWT auth on all sensitive endpoints
- Input size limits enforced server-side

---

## License

MIT
