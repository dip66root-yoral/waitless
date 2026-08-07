# QueueIQ 🎟️

**AI-powered smart digital queue management** — replace chaotic physical queues with a Gemini-powered system.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS v4 (mobile-first)
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (better-sqlite3, zero config)
- **AI**: Google Gemini 2.0 Flash (NLP request parsing)

## Quick Start

### 1. Setup Gemini API Key (optional but recommended)
```bash
cd backend
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY
# Get a free key at: https://aistudio.google.com/app/apikey
```

### 2. Install & Run Backend
```bash
cd backend
npm install
npm run seed      # loads demo data (Clinic, Salon, Bank queues)
npm run dev       # starts on http://localhost:3001
```

### 3. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

### 4. Open the App
- **User View**: http://localhost:5173/user
- **Provider Dashboard**: http://localhost:5173/provider
- **Landing Page**: http://localhost:5173

## Features

### 🧠 AI Request Parsing
Type a free-form request → Gemini extracts:
- Service type, urgency (low/medium/high), category, duration
- Automatically assigns token priority
- Graceful fallback if no API key

### 🎟️ Smart Token Generation
- Auto-generated tokens: `A-001` (Clinic), `B-001` (Salon), `C-001` (Bank)
- Priority-based queue ordering
- Real-time position tracking

### ⚡ Real-Time Updates
- Socket.io for instant push notifications
- Polling fallback (every 5s)
- "It's your turn!" toast notification

### 📊 Provider Dashboard
- Live queue with Call Next / Mark Done / Skip
- Stats: Waiting, Serving, Done, Skipped
- Multi-queue support with sidebar navigation

## Demo Queues (pre-seeded)
| Queue | Token Prefix | Avg Service |
|-------|-------------|-------------|
| 🏥 City Clinic | A-xxx | 15 min |
| ✂️ Style Studio Salon | B-xxx | 20 min |
| 🏦 National Bank | C-xxx | 12 min |

## API Endpoints
```
GET  /api/queues              — list all queues
GET  /api/queues/:id          — queue + token list
POST /api/tokens              — create new token
POST /api/tokens/queue/:id/next  — call next token
POST /api/tokens/queue/:id/skip  — skip current
PATCH /api/tokens/:id/status — update token status
POST /api/gemini/parse        — parse free-text request
GET  /api/health              — health check
```
