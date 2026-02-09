# Deploying Kuiper TTS to Google Cloud

This guide covers deploying the Kuiper TTS application to Google Cloud Platform (GCP), including Cloud Run for the backend API and optional frontend hosting.

## Architecture

| Component | GCP Service | Notes |
|-----------|-------------|-------|
| Backend API | Cloud Run | Serverless containers, auto-scaling |
| Frontend | Cloud Run or Firebase Hosting | Static SPA |
| Database | Supabase (external) | Or Cloud SQL if migrating |
| Auth | Supabase Auth | Or Firebase Auth if migrating |

The backend uses **Supabase** for database and storage. You can keep Supabase when deploying to GCP; no migration required.

---

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- A GCP project with billing enabled
- Supabase project (for DB + Auth + Storage)

---

## 1. Initial GCP Setup

```bash
# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# Create Artifact Registry repo for Docker images
gcloud artifacts repositories create kuiper-tts \
  --repository-format=docker \
  --location=us-central1 \
  --description="Kuiper TTS Docker images"
```

---

## 2. Configure Secret Manager (Recommended)

Store sensitive env vars in Secret Manager instead of plain env vars:

```bash
# Create secrets
echo -n "https://your-project.supabase.co" | gcloud secrets create SUPABASE_URL --data-file=-
echo -n "your-supabase-service-role-key" | gcloud secrets create SUPABASE_KEY --data-file=-
echo -n "your-admin-password" | gcloud secrets create ADMIN_PASSWORD --data-file=-
```

Then reference them in Cloud Run (see step 4).

---

## 3. Deploy Backend to Cloud Run

### Option A: Cloud Build (CI/CD)

Connect your repo to Cloud Build and use the provided `cloudbuild.yaml`:

1. **Cloud Build triggers**: In GCP Console → Cloud Build → Triggers, create a trigger:
   - Source: GitHub / Cloud Source Repositories
   - Build config: Cloud Build configuration file
   - Location: `cloudbuild.yaml` (repo root)

2. **Substitutions**: Set these in the trigger or in `cloudbuild.yaml`:
   - `_REGION`: e.g. `us-central1`
   - `_SERVICE_NAME`: `kuiper-tts-api`

3. **Environment variables**: Add them in Cloud Run after first deploy, or use a `service.yaml` (see Option B).

### Option B: Manual deploy

```bash
# Build and push
gcloud builds submit --config=cloudbuild.yaml .

# Or build locally and push
cd backend
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cloud-run-source-deploy/kuiper-tts-api:latest .
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cloud-run-source-deploy/kuiper-tts-api:latest

# Deploy
gcloud run deploy kuiper-tts-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cloud-run-source-deploy/kuiper-tts-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## 4. Set Cloud Run Environment Variables

In Cloud Console → Cloud Run → kuiper-tts-api → Edit & Deploy → Variables & Secrets:

| Variable | Value | Secret? |
|----------|-------|---------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Optional |
| `SUPABASE_KEY` | Your Supabase service role key | Yes |
| `ADMIN_PASSWORD` | Admin password for script management | Yes |
| `KUIPER_ENV` | `production` | No |
| `KUIPER_CORS_ORIGINS` | `https://your-frontend-domain.com` | No |

To use Secret Manager:

- Add secret: `SUPABASE_KEY` → Reference secret `projects/PROJECT_ID/secrets/SUPABASE_KEY:latest`

---

## 5. Deploy Frontend (Optional)

### A. Firebase Hosting

```bash
cd app
npm install -g firebase-tools
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

Set `VITE_API_URL` to your Cloud Run URL (e.g. `https://kuiper-tts-api-xxx.run.app/api`) before building.

### B. Cloud Run (Static + optional SSR)

You can serve the built SPA from Cloud Run using a simple nginx or static server image. See `Dockerfile.frontend` (create if needed) or use Firebase Hosting.

### C. Cloud Storage + Load Balancer

- Upload `app/dist` to a GCS bucket
- Configure a Load Balancer to serve the bucket as a static site

---

## 6. Environment Variables Summary

### Backend (Cloud Run)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase service role key | `eyJ...` |
| `ADMIN_PASSWORD` | Admin panel password | (secure string) |
| `KUIPER_ENV` | `production` or `development` | `production` |
| `KUIPER_CORS_ORIGINS` | Allowed origins (comma-separated) | `https://app.example.com` |
| `PORT` | Port (Cloud Run sets 8080) | Auto-set by Cloud Run |

### Frontend (build-time)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://kuiper-tts-api-xxx.run.app/api` |
| `VITE_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |

---

## 7. TTS (espeak-ng) on Cloud Run

The pronunciation feature uses `espeak-ng`. To enable it in the backend Docker image, uncomment in `backend/Dockerfile`:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng && rm -rf /var/lib/apt/lists/*
```

Then rebuild and redeploy.

---

## 8. Custom Domain & HTTPS

- Cloud Run provides HTTPS by default
- To use a custom domain: Cloud Run → Manage Custom Domains → Add mapping
- Ensure `KUIPER_CORS_ORIGINS` includes your domain

---

## 9. Monitoring & Logging

- **Logs**: Cloud Run → Logs, or Cloud Logging
- **Metrics**: Cloud Run → Metrics (requests, latency, errors)
- **Alerts**: Create alerting policies in Cloud Monitoring

---

## 10. Cost Considerations

- **Cloud Run**: Pay per request and CPU/memory use; generous free tier
- **Artifact Registry**: Storage for Docker images
- **Supabase**: Free tier available; upgrade as needed

---

## Quick Reference

```bash
# Deploy backend
gcloud builds submit --config=cloudbuild.yaml .

# View service URL
gcloud run services describe kuiper-tts-api --region us-central1 --format='value(status.url)'

# View logs
gcloud run services logs read kuiper-tts-api --region us-central1
```
