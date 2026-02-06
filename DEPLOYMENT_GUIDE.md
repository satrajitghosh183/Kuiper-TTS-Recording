# Kuyper TTS - Complete Deployment Guide

**Version:** 2.0.0  
**Last Updated:** February 2026

This guide provides step-by-step instructions for deploying the Kuyper TTS application from scratch using Supabase, Render, and Vercel.

**⚠️ IMPORTANT: Repository Structure**
- **Branch:** `all-reorg`
- **Base Path:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/`
- **Backend Path:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/backend/`
- **Frontend Path:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app/`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Structure](#repository-structure)
3. [Deployment Overview](#deployment-overview)
4. [Step 1: Supabase Setup](#step-1-supabase-setup)
5. [Step 2: Render Backend Deployment](#step-2-render-backend-deployment)
6. [Step 3: Vercel Frontend Deployment](#step-3-vercel-frontend-deployment)
7. [Step 4: Post-Deployment Configuration](#step-4-post-deployment-configuration)
8. [Step 5: Verification & Testing](#step-5-verification--testing)
9. [Troubleshooting](#troubleshooting)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Quick Reference Checklist](#quick-reference-checklist)

---

## Prerequisites

Before starting deployment, ensure you have:

| Requirement | Details |
|-------------|---------|
| **GitHub Account** | Repository must be accessible (public or private with access) |
| **Supabase Account** | Free tier available at [supabase.com](https://supabase.com) |
| **Render Account** | Free tier available at [render.com](https://render.com) |
| **Vercel Account** | Free tier available at [vercel.com](https://vercel.com) |
| **Repository Access** | Code must be pushed to GitHub/GitLab/Bitbucket |
| **Branch Access** | Code is in branch `all-reorg` |

**Note:** All three services offer free tiers sufficient for development and testing.

---

## Repository Structure

### ⚠️ Critical Configuration

Your code is nested deep in the repository structure. This requires special configuration:

```
your-repo/
└── voicetraining/
    └── Satrajits-Traning-Code_Needs_Refactoring/
        └── Train_TTS_Application/
            ├── app/                    # Frontend (Vite + React)
            │   ├── src/
            │   ├── package.json
            │   └── vercel.json
            ├── backend/                # Backend (FastAPI)
            │   ├── api/
            │   ├── core/
            │   ├── Dockerfile
            │   └── requirements.txt
            ├── supabase/
            │   └── schema.sql
            └── render.yaml
```

**Key Points:**
- **Branch:** Must use `all-reorg` (not `main` or `master`)
- **Render Root Directory:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application`
- **Vercel Root Directory:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app`
- **Schema Path:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/supabase/schema.sql`

---

## Deployment Overview

The application consists of three components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Render        │────▶│   Supabase      │
│   (Frontend)    │     │   (Backend API) │     │   (Database +   │
│   React SPA     │     │   FastAPI       │     │    Auth +       │
│                 │     │                 │     │    Storage)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Deployment Order:**
1. **Supabase** (Database, Auth, Storage) - Set up first
2. **Render** (Backend API) - Deploy second
3. **Vercel** (Frontend) - Deploy third
4. **Configuration** - Connect all services

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create account)
2. Click **"New Project"** button
3. Fill in project details:
   - **Name:** `kuiper-tts` (or your preferred name)
   - **Database Password:** Choose a strong password (save it securely)
   - **Region:** Select closest to your users
   - **Pricing Plan:** Free tier is sufficient
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### 1.2 Run Database Schema

1. In Supabase Dashboard, navigate to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Navigate to the schema file in your repository:
   - Path: `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/supabase/schema.sql`
   - Or clone the repo and open the file locally
4. Copy **ALL** contents of `supabase/schema.sql`
5. Paste into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. Verify success: You should see "Success. No rows returned"

**What this creates:**
- `scripts` table (for recording scripts)
- `recordings` table (for audio metadata)
- `user_settings` table (for user preferences)
- `recordings` storage bucket
- Storage policies (public read, service role write)
- Row Level Security (RLS) policies

### 1.3 Get API Keys

1. In Supabase Dashboard, go to **Settings** (gear icon) → **API**
2. Copy the following values (you'll need them later):

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   - Use for: `SUPABASE_URL` and `VITE_SUPABASE_URL`

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Use for: `VITE_SUPABASE_ANON_KEY` (frontend only)

   **service_role key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Use for: `SUPABASE_KEY` (backend only - **KEEP SECRET**)

**⚠️ Security Warning:** Never expose the `service_role` key in frontend code. It has admin privileges.

### 1.4 Configure Authentication (Optional)

1. Go to **Authentication** → **Providers** → **Email**
2. **Email Confirmation:** 
   - **For development:** Toggle OFF (no email confirmation needed)
   - **For production:** Toggle ON (users must verify email)
3. **Site URL:** Leave blank for now (will set after Vercel deployment)
4. **Redirect URLs:** Leave blank for now (will set after Vercel deployment)

**✅ Supabase Setup Complete!**  
Save your Project URL, anon key, and service_role key in a secure location.

---

## Step 2: Render Backend Deployment

### 2.1 Create Render Account & Connect Repository

1. Go to [render.com](https://render.com) and sign in (or create account)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select the repository containing the Kuyper TTS code
5. **⚠️ CRITICAL:** Select branch `all-reorg` (not `main` or `master`)
6. Click **"Connect"**

### 2.2 Configure Service Settings

**⚠️ IMPORTANT: Nested Repository Configuration**

Configure service with these **exact** settings:

| Setting | Value |
|---------|-------|
| **Name** | `kuiper-tts-api` |
| **Region** | Choose closest to Supabase region |
| **Branch** | `all-reorg` ⚠️ **CRITICAL** |
| **Root Directory** | `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application` ⚠️ **CRITICAL** |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `backend/Dockerfile` (relative to Root Directory) |
| **Docker Context** | `backend` (relative to Root Directory) |
| **Instance Type** | Free tier (512 MB RAM) |
| **Health Check Path** | `/api/health` |

**Key Points:**
- **Root Directory** must be set to the nested path (not just `backend` or root)
- **Dockerfile Path** is relative to Root Directory (so `backend/Dockerfile`)
- **Docker Context** is also relative to Root Directory (so `backend`)
- Render will checkout `all-reorg` branch, navigate to Root Directory, then use Dockerfile from there

### 2.3 Add Environment Variables

In the Render dashboard, scroll to **"Environment Variables"** section and add:

| Key | Value | Notes |
|-----|-------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | From Step 1.3 |
| `SUPABASE_KEY` | `eyJhbGci...` | **service_role** key from Step 1.3 |
| `KUIPER_ENV` | `production` | Fixed value |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | Choose a strong password |
| `KUIPER_CORS_ORIGINS` | `https://your-app.vercel.app` | **Temporary** - update after Vercel deploy |

**Note:** For `KUIPER_CORS_ORIGINS`, use a placeholder for now. You'll update it after Vercel deployment with the actual URL.

### 2.4 Deploy

1. Click **"Create Web Service"** (or **"Save Changes"**)
2. Render will start building the Docker image
3. Monitor the build logs:
   - Should see: "Installing dependencies..."
   - Should see: "Starting uvicorn..."
   - If you see "Dockerfile not found", check Root Directory path
4. Wait for deployment to complete (2-5 minutes)
5. Once deployed, note your Render URL:
   ```
   https://kuiper-tts-api.onrender.com
   ```
   (or similar)

### 2.5 Verify Backend Health

1. Open your Render service URL in a browser
2. Append `/api/health`:
   ```
   https://kuiper-tts-api.onrender.com/api/health
   ```
3. You should see:
   ```json
   {
     "status": "healthy",
     "version": "2.0.0",
     "environment": "production"
   }
   ```

**✅ Render Backend Deployment Complete!**  
Save your Render URL for the next step.

---

## Step 3: Vercel Frontend Deployment

### 3.1 Create Vercel Account & Import Project

1. Go to [vercel.com](https://vercel.com) and sign in (or create account)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository:
   - Select your Git provider
   - Find and select the Kuyper TTS repository
   - **⚠️ CRITICAL:** Select branch `all-reorg` (not `main` or `master`)
   - Click **"Import"**

### 3.2 Configure Project Settings

**⚠️ IMPORTANT: Nested Repository Configuration**

Vercel should auto-detect Vite, but you **must** configure Root Directory:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app` ⚠️ **CRITICAL** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` (auto-detected) |

**Key Points:**
- **Root Directory** must point to the `app` folder within the nested structure
- Click **"Edit"** next to Root Directory to set custom path
- Vercel will checkout `all-reorg` branch, navigate to Root Directory, then build from there
- The `package.json` must exist in the Root Directory

### 3.3 Add Environment Variables

In the **"Environment Variables"** section, add:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://kuiper-tts-api.onrender.com/api` | Your Render URL from Step 2.4 |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | From Step 1.3 |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | **anon** key from Step 1.3 |

**Important:** 
- All Vite env vars must start with `VITE_`
- Values are embedded at build time
- Redeploy after changing env vars

### 3.4 Deploy

1. Click **"Deploy"**
2. Monitor build logs:
   - Should see: "Installing dependencies..."
   - Should see: "Building application..."
   - Should see: "Build completed"
   - If you see "Cannot find module" or "Root Directory not found", check Root Directory path
3. Wait for deployment (1-3 minutes)
4. Once deployed, note your Vercel URL:
   ```
   https://kuiper-tts-xxxxx.vercel.app
   ```
   (or your custom domain)

### 3.5 Verify Frontend

1. Open your Vercel URL in a browser
2. You should see the Kuyper TTS welcome page
3. If you see "Server Not Available", that's expected - we need to update CORS next

**✅ Vercel Frontend Deployment Complete!**  
Save your Vercel URL for the next step.

---

## Step 4: Post-Deployment Configuration

### 4.1 Update Render CORS Settings

1. Go back to Render dashboard → Your backend service
2. Go to **"Environment"** tab
3. Find `KUIPER_CORS_ORIGINS`
4. Update value to include your Vercel URL:
   ```
   https://kuiper-tts-xxxxx.vercel.app,https://kuiper-tts-xxxxx.vercel.app/*
   ```
   (Include both with and without wildcard for Vercel preview URLs)
5. Click **"Save Changes"**
6. Render will automatically redeploy (wait 1-2 minutes)

### 4.2 Configure Supabase Auth URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL:**
   ```
   https://kuiper-tts-xxxxx.vercel.app
   ```
3. Add **Redirect URLs:**
   ```
   https://kuiper-tts-xxxxx.vercel.app/**
   ```
   (This allows redirects to any path on your domain)
4. Click **"Save"**

### 4.3 Verify Backend Connection

1. Refresh your Vercel frontend URL
2. The "Server Not Available" message should disappear
3. You should see scripts count and stats (may be 0 if no scripts yet)

**✅ Post-Deployment Configuration Complete!**

---

## Step 5: Verification & Testing

### 5.1 Test Authentication

1. Go to your Vercel URL
2. Click **"Sign Up"** (or **"Create account"**)
3. Enter email and password
4. If email confirmation is OFF: You'll be signed in immediately
5. If email confirmation is ON: Check email and click confirmation link
6. Verify you can sign in and out

### 5.2 Test Admin Panel

1. Sign in to the application
2. Navigate to **"Admin"** page
3. Enter the admin password (from `ADMIN_PASSWORD` env var)
4. Click **"Authenticate"**
5. You should see the script management interface

### 5.3 Upload a Test Script

1. In Admin panel, scroll to **"Upload Text File"**
2. Create a test file `test.txt` with content:
   ```
   This is the first test phrase.
   This is the second test phrase.
   Hello world, this is a test.
   ```
3. Upload the file
4. Optionally set a script name (or use default)
5. Click **"Upload & Save to Database"**
6. Verify script appears in the list

### 5.4 Test Recording

1. Navigate to **"Record"** page
2. Select the test script you just uploaded
3. Click the record button (or press Space)
4. Speak the phrase clearly
5. Click stop (or press Space again)
6. Verify recording saves successfully
7. Check **"Library"** page to see your recording

### 5.5 Verify Storage

1. Go to Supabase Dashboard → **Storage** → **recordings** bucket
2. You should see folders organized by user ID
3. Verify audio files (.wav) are being stored

**✅ All Tests Passed!**  
Your deployment is complete and functional.

---

## Troubleshooting

### Nested Repository Path Issues

#### Render: "Dockerfile not found"

**Problem:** Render can't find the Dockerfile

**Solutions:**
1. Verify **Branch** is set to `all-reorg`:
   - Go to Render → Your service → Settings → Build & Deploy
   - Check Branch is `all-reorg`

2. Verify **Root Directory** is set correctly:
   ```
   voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application
   ```
   - Path is case-sensitive
   - No trailing slash

3. Verify **Dockerfile Path** is relative to Root Directory:
   ```
   backend/Dockerfile
   ```
   - Should NOT include the full nested path
   - Should be relative to Root Directory

4. Verify **Docker Context** is relative to Root Directory:
   ```
   backend
   ```
   - Should NOT include the full nested path

5. Check build logs:
   - Go to Render → Your service → Logs
   - Look for "Dockerfile not found" errors
   - Verify the path structure

#### Render: "Module not found" or Import Errors

**Problem:** Python can't find modules

**Solutions:**
1. Verify Dockerfile copies files correctly:
   ```dockerfile
   COPY requirements.txt .
   COPY . .
   ```
   This should copy everything from `backend/` directory

2. Check that `backend/` contains:
   - `api/` folder with `main.py`
   - `core/` folder with `config.py`
   - `requirements.txt`
   - `Dockerfile`

3. Verify Docker Context is `backend` (not the full nested path)

#### Vercel: "Cannot find module" or Build Fails

**Problem:** Vercel can't find dependencies or source files

**Solutions:**
1. Verify **Branch** is set to `all-reorg`:
   - Go to Vercel → Project Settings → Git
   - Check Production Branch is `all-reorg`

2. Verify **Root Directory** points to `app` folder:
   ```
   voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app
   ```
   - Path is case-sensitive
   - Must end with `/app`

3. Check that `app/` contains:
   - `package.json`
   - `src/` folder
   - `vite.config.ts`

4. Check build logs:
   - Go to Vercel → Your deployment → Build Logs
   - Look for "Cannot find module" errors
   - Verify paths are correct

5. Verify `package.json` exists in the Root Directory:
   - Vercel should find `package.json` in the Root Directory
   - If not, check the path

#### Vercel: "Root Directory not found"

**Problem:** Vercel can't find the specified root directory

**Solutions:**
1. Verify branch is `all-reorg`:
   - Go to Vercel → Project Settings → Git
   - Check Production Branch is `all-reorg`

2. Verify path exists:
   - Check repository structure matches expected path
   - Path is case-sensitive
   - Ensure folder names match exactly (including hyphens/underscores)

3. Try verifying locally:
   - Clone repo: `git clone <your-repo-url>`
   - Checkout branch: `git checkout all-reorg`
   - Navigate: `cd voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app`
   - Verify `package.json` exists

### Backend Issues

#### Backend won't start / Health check fails

**Symptoms:** Render shows "Unhealthy" or deployment fails

**Solutions:**
1. Check Render logs for errors:
   - Go to Render dashboard → Your service → **"Logs"** tab
   - Look for Python import errors or missing dependencies

2. Verify environment variables:
   - Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set correctly
   - Check for typos (no extra spaces, correct URLs)

3. Verify Dockerfile:
   - Ensure `backend/Dockerfile` exists in the Root Directory
   - Check that `requirements.txt` is in `backend/` directory

4. Check Python version:
   - Dockerfile uses `python:3.11-slim`
   - Ensure compatibility with your code

5. Verify Root Directory:
   - Check Root Directory path is correct
   - Ensure branch is `all-reorg`

#### "503 Service Unavailable" or "Failed to connect"

**Symptoms:** Frontend can't reach backend

**Solutions:**
1. Verify Render service is running:
   - Check Render dashboard → Service status should be "Live"
   - Check health endpoint: `https://your-render-url.onrender.com/api/health`

2. Check CORS configuration:
   - Verify `KUIPER_CORS_ORIGINS` includes your Vercel URL
   - Ensure no trailing slashes in URLs
   - Format: `https://domain.com,https://domain.com/*`

3. Verify Render URL in frontend:
   - Check `VITE_API_URL` in Vercel environment variables
   - Should be: `https://your-render-url.onrender.com/api` (with `/api` suffix)

#### "Invalid admin password"

**Symptoms:** Admin panel authentication fails

**Solutions:**
1. Verify `ADMIN_PASSWORD` in Render matches what you're entering
2. Check for extra spaces or special characters
3. Ensure you're using the correct header format (backend expects `X-Admin-Key`)

### Frontend Issues

#### "Server Not Available" message

**Symptoms:** Welcome page shows server unavailable

**Solutions:**
1. Verify backend is running (check Render health endpoint)
2. Check `VITE_API_URL` in Vercel:
   - Should point to Render URL with `/api` suffix
   - Example: `https://kuiper-tts-api.onrender.com/api`

3. Check browser console for CORS errors:
   - If CORS errors appear, update `KUIPER_CORS_ORIGINS` in Render
   - Redeploy Render service after updating

4. Verify network connectivity:
   - Try accessing Render health endpoint directly in browser
   - Check if Render service is in "Sleep" mode (free tier spins down after inactivity)

#### "Authorization required" when recording

**Symptoms:** Can't save recordings, get 401 error

**Solutions:**
1. Verify Supabase environment variables:
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
   - Ensure you're using the **anon** key (not service_role)

2. Check authentication state:
   - Sign out and sign back in
   - Clear browser cache and cookies
   - Try incognito/private window

3. Verify Supabase Auth configuration:
   - Check Supabase Dashboard → Authentication → Providers → Email is enabled
   - Verify Site URL matches your Vercel URL

#### Build fails on Vercel

**Symptoms:** Vercel deployment fails during build

**Solutions:**
1. Check build logs:
   - Go to Vercel dashboard → Your deployment → **"Build Logs"**
   - Look for TypeScript errors or missing dependencies

2. Verify Node.js version:
   - Vercel should auto-detect, but ensure Node 18+ is used
   - Can specify in `package.json`:
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

3. Check for missing dependencies:
   - Ensure `package.json` has all required packages
   - Run `npm install` locally to verify

4. Verify root directory:
   - Ensure **Root Directory** is set correctly (nested path to `app` folder)
   - Ensure branch is `all-reorg`

### Supabase Issues

#### "Script not found" or database errors

**Symptoms:** Can't create scripts or query fails

**Solutions:**
1. Verify schema was run:
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM scripts LIMIT 1;`
   - Should not error (may return empty result)

2. Check RLS policies:
   - Go to Supabase Dashboard → Authentication → Policies
   - Verify policies exist for `scripts` and `recordings` tables

3. Verify service_role key:
   - Ensure `SUPABASE_KEY` in Render uses **service_role** key (not anon)
   - Check Supabase Dashboard → Settings → API

#### Storage upload fails

**Symptoms:** Recordings can't be saved, storage errors

**Solutions:**
1. Verify storage bucket exists:
   - Go to Supabase Dashboard → Storage
   - Should see `recordings` bucket
   - If missing, bucket creation is in `schema.sql` - re-run it

2. Check storage policies:
   - Go to Storage → `recordings` bucket → Policies
   - Should have policies for SELECT, INSERT, UPDATE, DELETE
   - Policies should allow service_role access

3. Verify storage path format:
   - Backend creates paths like: `{user_id}/{script_id}/{filename}.wav`
   - Check Supabase Storage → `recordings` bucket for folder structure

#### Authentication not working

**Symptoms:** Can't sign up or sign in

**Solutions:**
1. Check Supabase Auth settings:
   - Go to Authentication → Providers → Email
   - Ensure Email provider is enabled
   - Check if email confirmation is required

2. Verify Site URL:
   - Go to Authentication → URL Configuration
   - Site URL should match your Vercel URL exactly
   - Redirect URLs should include your domain

3. Check email settings (if confirmation enabled):
   - Go to Settings → Auth → Email Templates
   - Verify email templates are configured
   - Check spam folder for confirmation emails

### General Issues

#### Environment variables not working

**Symptoms:** App uses wrong URLs or missing config

**Solutions:**
1. **Vercel:** Environment variables are embedded at build time
   - Must redeploy after changing env vars
   - Go to Deployments → Redeploy

2. **Render:** Environment variables take effect immediately
   - But may need service restart
   - Go to Manual Deploy → Clear build cache & deploy

3. Verify variable names:
   - Frontend: Must start with `VITE_`
   - Backend: Check `backend/core/config.py` for exact names

#### Slow performance / Timeouts

**Symptoms:** Requests timeout or very slow

**Solutions:**
1. **Render Free Tier:** Services spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds
   - Consider upgrading to paid tier for always-on

2. **Supabase Free Tier:** Has rate limits
   - Check Supabase Dashboard → Settings → Usage
   - Monitor API calls and storage usage

3. **Database queries:** Check for missing indexes
   - Schema includes indexes, but verify they exist
   - Go to Supabase Dashboard → Table Editor → Check indexes

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ Yes | - | Supabase project URL |
| `SUPABASE_KEY` | ✅ Yes | - | Supabase **service_role** key |
| `KUIPER_ENV` | No | `development` | Set to `production` |
| `ADMIN_PASSWORD` | No | `DovKrugersRecording` | Admin panel password |
| `KUIPER_CORS_ORIGINS` | No | `localhost:5173` | Comma-separated allowed origins |
| `KUIPER_HOST` | No | `0.0.0.0` | Server host (don't change) |
| `KUIPER_PORT` | No | `8000` | Server port (don't change) |
| `KUIPER_DEBUG` | No | `false` | Debug mode |
| `KUIPER_LOG_LEVEL` | No | `INFO` | Logging level |
| `KUIPER_MAX_UPLOAD_SIZE_MB` | No | `100` | Max upload size |
| `KUIPER_RATE_LIMIT` | No | `120` | Requests per minute |

### Frontend (Vercel)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ Yes | `http://localhost:8000/api` | Backend API URL |
| `VITE_SUPABASE_URL` | ✅ Yes | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | - | Supabase **anon** key |

**Important Notes:**
- All frontend env vars must start with `VITE_`
- Values are embedded at build time (must redeploy to update)
- Never expose `service_role` key in frontend

---

## Quick Reference Checklist

Use this checklist to ensure nothing is missed:

### Pre-Deployment
- [ ] Repository is accessible on GitHub/GitLab/Bitbucket
- [ ] Branch `all-reorg` exists and contains the code
- [ ] Code is pushed to remote repository
- [ ] Have accounts for Supabase, Render, and Vercel
- [ ] Have access to email for account verification

### Supabase Setup
- [ ] Created Supabase project
- [ ] Ran `supabase/schema.sql` in SQL Editor (from nested path)
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Copied service_role key (kept secure)
- [ ] Configured email authentication settings

### Render Backend
- [ ] Created Render account
- [ ] Connected repository to Render
- [ ] **Selected branch `all-reorg`** ⚠️
- [ ] Created Web Service (Docker)
- [ ] **Set Root Directory:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application` ⚠️
- [ ] Set Dockerfile path: `backend/Dockerfile` (relative to Root Directory)
- [ ] Set Docker context: `backend` (relative to Root Directory)
- [ ] Added all environment variables
- [ ] Set health check path: `/api/health`
- [ ] Deployed successfully
- [ ] Verified health endpoint works
- [ ] Saved Render URL

### Vercel Frontend
- [ ] Created Vercel account
- [ ] Imported repository
- [ ] **Selected branch `all-reorg`** ⚠️
- [ ] **Set root directory:** `voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app` ⚠️
- [ ] Verified framework: Vite
- [ ] Added all environment variables
- [ ] Deployed successfully
- [ ] Saved Vercel URL

### Post-Deployment
- [ ] Updated Render `KUIPER_CORS_ORIGINS` with Vercel URL
- [ ] Updated Supabase Site URL with Vercel URL
- [ ] Added Supabase Redirect URLs
- [ ] Verified frontend connects to backend
- [ ] Tested user sign-up
- [ ] Tested user sign-in
- [ ] Tested admin panel access
- [ ] Uploaded test script
- [ ] Tested recording functionality
- [ ] Verified recordings appear in Library
- [ ] Checked Supabase Storage for audio files

### Documentation
- [ ] Saved all URLs and keys securely
- [ ] Documented admin password
- [ ] Noted any custom configurations

---

## Quick Reference: Paths Configuration

### Render Configuration

```
Repository Root: your-repo/
├── Branch: all-reorg ⚠️
├── Root Directory: voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application
├── Dockerfile Path: backend/Dockerfile (relative to Root Directory)
└── Docker Context: backend (relative to Root Directory)
```

**Result:** Render will:
1. Checkout `all-reorg` branch
2. Navigate to Root Directory
3. Use `backend/Dockerfile` from that location
4. Set Docker context to `backend/` folder

### Vercel Configuration

```
Repository Root: your-repo/
├── Branch: all-reorg ⚠️
└── Root Directory: voicetraining/Satrajits-Traning-Code_Needs_Refactoring/Train_TTS_Application/app
```

**Result:** Vercel will:
1. Checkout `all-reorg` branch
2. Navigate to Root Directory (`app/` folder)
3. Run `npm install` in that directory
4. Run `npm run build` in that directory
5. Serve files from `dist/` folder

---

## Additional Resources

### Project Structure
```
your-repo/
└── voicetraining/
    └── Satrajits-Traning-Code_Needs_Refactoring/
        └── Train_TTS_Application/
            ├── app/                    # Frontend (Vite + React)
            │   ├── src/
            │   ├── package.json
            │   └── vercel.json
            ├── backend/                # Backend (FastAPI)
            │   ├── api/
            │   ├── core/
            │   ├── Dockerfile
            │   └── requirements.txt
            ├── supabase/
            │   └── schema.sql         # Database schema
            └── render.yaml            # Render blueprint (optional)
```

### Key Files
- **Backend Entry:** `backend/api/main.py`
- **Frontend Entry:** `app/src/main.tsx`
- **Database Schema:** `supabase/schema.sql` (from nested path)
- **Dockerfile:** `backend/Dockerfile` (relative to Root Directory)
- **Vercel Config:** `app/vercel.json`

### Support & Documentation
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **FastAPI Docs:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Vite Docs:** [vitejs.dev](https://vitejs.dev)

---

## Security Best Practices

1. **Never commit secrets:**
   - `.env` files are in `.gitignore`
   - Never commit API keys or passwords

2. **Use environment variables:**
   - All secrets stored as environment variables
   - Never hardcode in source code

3. **Service role key:**
   - Only use in backend (Render)
   - Never expose in frontend (Vercel)

4. **Admin password:**
   - Choose a strong password
   - Store securely (password manager)
   - Rotate periodically

5. **CORS configuration:**
   - Only allow your Vercel domain(s)
   - Don't use wildcards in production

6. **Supabase RLS:**
   - Row Level Security is enabled
   - Policies restrict access appropriately

---

## Maintenance

### Regular Tasks

1. **Monitor usage:**
   - Check Supabase Dashboard → Usage
   - Monitor API calls, storage, bandwidth

2. **Check logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployment → Logs
   - Supabase: Dashboard → Logs

3. **Update dependencies:**
   - Backend: Update `backend/requirements.txt`
   - Frontend: Update `app/package.json`
   - Test locally before deploying

4. **Backup database:**
   - Supabase provides automatic backups (paid tier)
   - Or export manually via SQL Editor

### Scaling Considerations

**Free Tier Limits:**
- **Render:** Services spin down after inactivity
- **Vercel:** 100GB bandwidth/month
- **Supabase:** 500MB database, 1GB storage, 2GB bandwidth

**When to Upgrade:**
- High traffic or user base
- Need always-on backend (Render)
- Large storage requirements (Supabase)
- Custom domain requirements

---

## Conclusion

Congratulations! You've successfully deployed the Kuyper TTS application. The system is now live and ready for users to contribute voice recordings.

**Next Steps:**
1. Upload initial scripts via Admin panel
2. Test with multiple users
3. Monitor performance and usage
4. Consider custom domain setup
5. Set up monitoring/analytics if needed

**Need Help?**
- Check the Troubleshooting section above
- Review service-specific documentation
- Check application logs for errors
- Verify all environment variables are set correctly
- Double-check branch and Root Directory paths

---

**Document Version:** 2.0.0  
**Last Updated:** February 2026  
**Maintained By:** Kuyper TTS Team
