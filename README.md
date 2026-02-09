# Kuyper TTS – Voice Recording Application

A web application for recording voice samples to train text-to-speech (TTS) models. Users sign in, select scripts, record phrases, and contribute to an open-source dataset that makes research more accessible.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Supabase Setup](#supabase-setup)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

**Kuyper TTS** is an open-source text-to-speech system that helps researchers read papers aloud. Your voice recordings train the model—every clip you contribute makes research more accessible.

The application consists of:

- **Frontend**: React + Vite SPA with Supabase Auth, recording studio UI, and admin panel
- **Backend**: FastAPI REST API for scripts, recordings, and storage
- **Database & Storage**: Supabase (PostgreSQL + Storage)

---

## Features

| Feature | Description |
|--------|-------------|
| **Email Auth** | Sign up / sign in with Supabase Auth (email + password) |
| **Account-Linked Recordings** | Recordings are tied to your user account; no manual name entry |
| **Script Management** | Admin uploads `.txt` scripts (one phrase per line) |
| **Recording Studio** | Select a script, record each phrase with live waveform, gain/bass/treble controls |
| **Progress Tracking** | See how many lines you’ve recorded per script |
| **Audio Controls** | Input device selection, gain, bass, treble (persisted in localStorage) |
| **Admin Panel** | Password-protected script upload, create, edit, delete |

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   React Frontend    │────▶│   FastAPI Backend    │────▶│      Supabase       │
│   (Vite + Tailwind) │     │   (Python)           │     │  PostgreSQL + Auth  │
│   localhost:5173    │     │   localhost:8000     │     │  + Storage          │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                              │                            │
         │  Supabase Auth (JWT)         │  service_role key          │
         │  API calls with Bearer token │  JWKS for JWT verify       │
         └──────────────────────────────┴────────────────────────────┘
```

### Data Flow

1. **Auth**: User signs in via Supabase Auth → receives JWT
2. **Scripts**: Admin uploads `.txt` → backend stores in `scripts` table
3. **Recording**: User selects script → records phrase → frontend sends WAV + metadata with `Authorization: Bearer <token>`
4. **Backend**: Verifies JWT via Supabase JWKS → extracts `user_id` → saves to `recordings` table and Storage bucket
5. **Progress**: Frontend fetches `/api/recording/progress` with JWT → backend returns user’s progress per script

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, PyJWT (JWKS), httpx |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password), JWT |
| **Storage** | Supabase Storage (WAV files) |
| **Deployment** | Vercel (frontend), Render (backend), Supabase (hosted) |

---

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18+ | For frontend (Vite, npm) |
| **npm** | 9+ | Comes with Node.js |
| **Python** | 3.10+ | For backend (FastAPI) |
| **pip** | Latest | Python package manager |
| **Supabase account** | — | Free tier at [supabase.com](https://supabase.com) |
| **Git** | — | For cloning the repo |

---

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Train_TTS_Application
```

### 2. Install Dependencies

**Backend:**

```bash
pip install -r backend/requirements.txt
```

**Frontend:**

```bash
cd app
npm install
cd ..
```

### 3. Supabase Setup

See [Supabase Setup](#supabase-setup) below for detailed steps.

### 4. Configure Environment

**Backend** – copy the example and edit:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your Supabase URL and service role key.

**Frontend** – copy the example and edit:

```bash
cp app/.env.example app/.env
```

Edit `app/.env` with your Supabase URL, anon key, and API URL.

### 5. Run the Application

**Terminal 1 – Backend:**

```bash
python run_server.py
```

Backend runs at `http://localhost:8000`.

**Terminal 2 – Frontend:**

```bash
cd app && npm run dev
```

Frontend runs at `http://localhost:5173`.

### 6. First Use

1. Open `http://localhost:5173`
2. Click **Create account** → sign up with email and password
3. If Supabase has email confirmation enabled, confirm via the link in your email
4. Sign in
5. Go to **Admin** → enter the admin password (from `ADMIN_PASSWORD`) → Authenticate
6. Upload a `.txt` file (e.g. `LauraVoice.txt` or `phoneme_coverage.txt` from the repo root)
7. Go to **Record** → select a script → start recording

---

## Supabase Setup

### Step 1: Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose organization, name, database password, and region
4. Wait for the project to be created

### Step 2: Run the Schema

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the editor and click **Run**

This creates:

- `scripts` table
- `recordings` table (with `user_id`, `recorder_name`, `phrase_text`)
- `recordings` storage bucket
- Storage policies (read, insert, update, delete)
- Row Level Security (RLS) policies

### Step 3: Get API Keys

1. Go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → use for `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → use for `SUPABASE_KEY` (backend only; keep secret)

### Step 4: Auth Settings (Optional)

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** on or off (off = no confirmation email for local dev)
3. Configure **Site URL** and **Redirect URLs** if needed for production

### Migrations (Existing Projects)

If you already have a database and need to apply changes incrementally:

| Migration | Purpose |
|-----------|---------|
| `001_add_phrase_and_recorder.sql` | Adds `phrase_text`, `recorder_name` to `recordings` |
| `002_add_user_id_to_recordings.sql` | Adds `user_id` for account-linked recordings |

Run these in the SQL Editor in order if your schema is older.

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| **scripts** | Script metadata: `name`, `lines` (text array), `line_count` |
| **recordings** | Recording metadata: `user_id`, `recorder_name`, `script_id`, `line_index`, `phrase_text`, `filename`, `storage_path`, audio stats |

### Key Columns (recordings)

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Links to `auth.users`; null for legacy records |
| `recorder_name` | VARCHAR | Identifier (user_id as string for new records) |
| `phrase_text` | TEXT | Exact text that was read |
| `storage_path` | VARCHAR | Path in bucket: `recordings/{recorder_name}/{script_id}/{filename}` |

### Storage

- **Bucket**: `recordings`
- **Path format**: `recordings/{recorder_name}/{script_id}/{filename}.wav`
- **Policies**: Public read; service role can insert, update, delete

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_KEY` | Yes | Supabase **service_role** key (not anon) |
| `ADMIN_PASSWORD` | No | Admin page password (default: `DovKrugersRecording`) |
| `KUIPER_CORS_ORIGINS` | No | Comma-separated allowed origins (default includes localhost) |
| `KUIPER_ENV` | No | `development` or `production` |
| `KUIPER_DEBUG` | No | `true` or `false` |
| `KUIPER_LOG_LEVEL` | No | `DEBUG`, `INFO`, `WARNING`, `ERROR` |

### Frontend (`app/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API base URL (default: `http://localhost:8000/api`) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase **anon public** key |

---

## Running the Application

### Development

```bash
# Backend (from project root)
python run_server.py

# Frontend (from project root)
cd app && npm run dev
```

### Production Build (Frontend)

```bash
cd app
npm run build
```

Output is in `app/dist/`.

### Seed Scripts (Optional)

To seed scripts from local `.txt` files:

```bash
python backend/scripts/seed_scripts_from_local.py
```

Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set (e.g. in `backend/.env`).

---

## Deployment

### Overview

| Service | Purpose | Typical Host |
|---------|---------|--------------|
| **Supabase** | Database, Auth, Storage | supabase.com |
| **Render** | Backend API | render.com |
| **Google Cloud** | Backend API (Cloud Run), Frontend (Firebase) | cloud.google.com |
| **Vercel** | Frontend SPA | vercel.com |

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Note **Project URL**, **anon key**, and **service_role key**

### Render (Backend)

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your repository
3. Configure:
   - **Runtime**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
4. Add environment variables:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_KEY` | Your Supabase service_role key |
   | `ADMIN_PASSWORD` | Admin password |
   | `KUIPER_ENV` | `production` |
   | `KUIPER_CORS_ORIGINS` | `https://your-app.vercel.app` (your frontend URL) |

5. Deploy and note the Render URL (e.g. `https://kuiper-tts-api.onrender.com`)

**Blueprint:** If the repo has `render.yaml`, connect the repo and Render can create the service from it. Add env vars in the dashboard.

### Google Cloud (Backend + Frontend)

Deploy to **Cloud Run** for the backend and optionally **Firebase Hosting** for the frontend. See **[GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)** for full instructions.

Quick start:

```bash
# Enable APIs and create Artifact Registry repo
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create kuiper-tts --repository-format=docker --location=us-central1

# Deploy backend
gcloud builds submit --config=cloudbuild.yaml .
```

Set environment variables in Cloud Run (see `GCP_DEPLOYMENT.md`). The backend uses `PORT` from Cloud Run (default 8080).

### Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your repository
3. Configure:
   - **Root Directory**: `app`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-render-url.onrender.com/api` |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Deploy

### Post-Deploy

1. Update Render `KUIPER_CORS_ORIGINS` with your actual Vercel URL
2. In Supabase **Authentication** → **URL Configuration**, set **Site URL** and **Redirect URLs** to your Vercel domain
3. Test: sign up, sign in, Admin upload, Record a phrase

---

## Project Structure

```
Train_TTS_Application/
├── app/                          # React frontend (Vite)
│   ├── public/                   # Static assets
│   │   ├── fonts/                # TT Otilito Sans (add WOFF2 files)
│   │   ├── startup-bg.mp4        # Auth page background
│   │   └── ...
│   ├── src/
│   │   ├── components/           # UI components
│   │   │   ├── RecordingStudio/  # Recording-specific components
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── GravityText.tsx
│   │   │   └── ...
│   │   ├── contexts/             # AuthContext
│   │   ├── hooks/                # useAudioRecorder
│   │   ├── lib/                  # api.ts, supabase.ts
│   │   ├── pages/                # Welcome, Record, Admin, Login, SignUp
│   │   └── styles/              # globals.css, studio.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── vercel.json
├── backend/
│   ├── api/
│   │   └── main.py               # FastAPI routes
│   ├── core/
│   │   ├── config.py
│   │   └── audio_processor.py
│   ├── scripts/
│   │   └── seed_scripts_from_local.py
│   ├── db.py                    # Supabase client
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── supabase/
│   ├── schema.sql               # Full schema (run for fresh setup)
│   └── migrations/              # Incremental migrations
│       ├── 001_add_phrase_and_recorder.sql
│       └── 002_add_user_id_to_recordings.sql
├── data/                        # Sample metadata (optional)
├── run_server.py                # Local backend launcher
├── render.yaml                  # Render blueprint
└── README.md
```

---

## API Reference

### Public (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check; returns status, version, environment |

### Scripts (Public Read)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scripts` | GET | List all scripts |
| `/api/scripts/{id}` | GET | Get script by ID |

### Recordings (Requires `Authorization: Bearer <token>`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recording/save` | POST | Save a recording (multipart: audio file + metadata) |
| `/api/recording/list` | GET | List recordings for the authenticated user |
| `/api/recording/progress` | GET | Recording progress per script for the authenticated user |

### Admin (Requires `X-Admin-Key` Header)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/scripts` | POST | Create script (JSON body) |
| `/api/admin/scripts/from-file` | POST | Create script from `.txt` upload |
| `/api/admin/scripts/{id}` | PUT | Update script |
| `/api/admin/scripts/{id}` | DELETE | Delete script |

---

## Troubleshooting

### Backend won’t start

- Ensure Python 3.10+ is installed: `python --version`
- Install dependencies: `pip install -r backend/requirements.txt`
- Check `backend/.env` has valid `SUPABASE_URL` and `SUPABASE_KEY`

### Frontend can’t connect to backend

- Verify `VITE_API_URL` in `app/.env` (e.g. `http://localhost:8000/api`)
- Ensure the backend is running on port 8000
- Check CORS: `KUIPER_CORS_ORIGINS` should include `http://localhost:5173`

### “Authorization required” when recording

- Sign in before recording
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- The frontend sends the Supabase session token in the `Authorization` header

### Supabase schema errors

- Run `supabase/schema.sql` in the SQL Editor
- For existing DBs, run migrations in order: `001_...` then `002_...`

### Admin page won’t authenticate

- Check `ADMIN_PASSWORD` matches what you enter
- Backend must receive `X-Admin-Key: <password>` in the request header

### Storage upload fails

- Ensure the `recordings` bucket exists (created by `schema.sql`)
- Check storage policies in Supabase Dashboard → Storage → Policies
- Backend uses the service_role key for storage writes

---

## License

MIT
