# Cloud Fullstack Blog

A compact, practical final-project README for the Cloud Fullstack Blog assignment. This document describes the architecture, how to run locally and in containers, how CI/CD and Cloud Run deployments work, monitoring, security considerations, and links to the running services and repository.

---

## Project Overview

This project is a cloud-deployed full-stack blog application consisting of a static frontend and a RESTful backend. The app tracks visitor counts and displays traffic statistics using a persistent cloud database. It demonstrates containerization (Docker), serverless deployment with Google Cloud Run, CI/CD automation using GitHub Actions, and cloud-native monitoring with Cloud Monitoring and Logging.

Key features:

* Static multi-page frontend served by Nginx (Cloud Run)
* Flask backend API (Cloud Run) with endpoints to record visits and return stats
* Persistent storage using Google Firestore (Native mode)
* CI/CD using GitHub Actions to build and deploy frontend & backend to Cloud Run
* Monitoring dashboard (Cloud Monitoring) showing traffic, latency and errors

---

## Architecture

```
User Browser
    |
    v
Frontend Service (Cloud Run - Nginx)
    |
    v  HTTP
Backend Service (Cloud Run - Flask)
    |
    v  Firestore SDK
Firestore (NoSQL Database)

Cloud Monitoring & Logging collect logs/metrics from Cloud Run
GitHub Actions push -> Cloud Build -> Cloud Run deployments
```

**Data flow (one sentence per arrow):**

* The browser loads static HTML/CSS/JS from the Frontend service.\
* The frontend JavaScript calls the backend REST API for `/visit` and `/stats/*` endpoints.\
* The backend processes requests and persists visit events to Firestore.\
* Cloud Run sends logs and metrics automatically to Cloud Logging and Cloud Monitoring.

---

## Tech stack

* **Frontend**: HTML, CSS, JavaScript (static files), Nginx in container
* **Backend**: Python 3.11, Flask, Flask-CORS
* **Database**: Google Firestore (Native mode)
* **Containerization**: Docker
* **CI/CD**: GitHub Actions (workflows: deploy-backend.yml, deploy-frontend.yml)
* **Cloud**: Google Cloud Run, Cloud Monitoring, Cloud Logging

---

## Local development

### Prerequisites

* Python 3.10+ (for local dev helpers)
* Docker
* gcloud CLI (for deployments)
* A Firestore database in the GCP project

### Backend (local)

From project root:

```bash
# run Python backend directly
cd backend
python app.py
# By default it listens on 0.0.0.0:5000 (or honors PORT env var)
```

### Frontend (local)

From project root:

```bash
cd frontend
python -m http.server 8000
# open http://127.0.0.1:8000/visitors.html
```

> Note: to use the deployed Cloud Run backend when testing locally, set `window.BACKEND_URL` in `frontend/js/config.js` to the Cloud Run backend URL (example: `https://blog-backend-xxxxx.a.run.app`).

---

## Docker (local containerized testing)

### Backend Docker

`backend/Dockerfile` is prepared. Build and run:

```bash
cd backend
docker build -t blog-backend:local .
# run with service account key mounted (for Firestore access)
docker run --rm -p 5000:5000 \
  -v /path/to/gha-deployer-key.json:/secrets/sa.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa.json \
  blog-backend:local
```

Important: inside the container the Flask app binds to `0.0.0.0` and reads `PORT` environment variable if present.

### Frontend Docker

`frontend/Dockerfile` uses Nginx. Build and run:

```bash
cd frontend
docker build -t blog-frontend:local .
docker run --rm -p 8080:80 blog-frontend:local
# open http://127.0.0.1:8080/visitors.html
```

When running in Cloud Run, Nginx is configured to listen on port `8080` (Cloud Run's $PORT).

---

## Deployment (Cloud Run)

### Manual deploy (what I did during development)

From backend folder (example):

```bash
gcloud run deploy blog-backend --source . --region asia-southeast1 --allow-unauthenticated
```

From frontend folder:

```bash
gcloud run deploy blog-frontend --source . --region asia-southeast1 --allow-unauthenticated
```

**Important runtime notes**:

* The Flask app reads the `PORT` environment variable and binds to `0.0.0.0` so Cloud Run can route traffic.
* Nginx in the frontend is configured to listen on `8080` to match Cloud Run's port.

---

## CI/CD (GitHub Actions)

### Overview

* Two GitHub Actions workflows (deployed via the GitHub UI initially):

  * `.github/workflows/deploy-backend.yml` — builds and deploys backend on push to `main`
  * `.github/workflows/deploy-frontend.yml` — builds and deploys frontend on push to `main`

### Authentication

* GitHub Actions uses a GCP service account JSON key stored in repo secrets (`GCP_SA_KEY`) to authenticate to GCP. The SA must have roles to deploy to Cloud Run and write artifact repository and Firestore if needed (e.g. `roles/run.admin`, `roles/artifactregistry.writer`, `roles/datastore.user`).

### How it works

1. Push to `main` triggers workflows.\
2. Actions authenticates using the SA key.\
3. `gcloud run deploy --source` builds and deploys the service.\

---

## Monitoring & Logging

Cloud Run automatically emits logs to Cloud Logging and metrics to Cloud Monitoring. A custom dashboard was created with the following charts (recommended for README screenshots):

1. Request count (Cloud Run revision) — backend service filter
2. Request latency (p95)
3. Error rate / 5xx count

How to view logs:

* Cloud Console → Cloud Run → select service → Logs

How to create the dashboard (console quick steps):

1. Monitoring → Dashboards → Create Dashboard
2. Add the charts above with a filter on the backend service name
3. Save and take screenshots for documentation

---

## Firestore structure

Collection name: `visits`
Each document contains:

```json
{
  "timestamp": "<ISO-8601 UTC timestamp>"
}
```

Usage:

* `POST /visit` should create a new document with the current UTC timestamp
* `GET /stats/total` returns total documents count
* `GET /stats/monthly` returns number of documents in last 30 days

---

## Security & secrets

* Service account keys are never committed to the repo. The JSON key is stored locally and only pasted into GitHub Actions secrets for automation.
* GitHub Actions secrets used: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SA_KEY`.
* Cloud Run services use the default service identity or a custom service account assigned at deployment. The runtime service account must have `roles/datastore.user` for Firestore access.

---

## Troubleshooting notes

* **Flask inside Docker returns empty reply**: fix by binding to `0.0.0.0` instead of `127.0.0.1`.
* **Cloud Run failing to start**: make sure the app listens on `$PORT` (Cloud Run sets `PORT`, typically 8080).
* **PermissionDenied on write**: ensure the service account has `roles/datastore.user` for write access.
* **Workflow push rejected by GitHub**: initial workflow must be created from the GitHub UI or use a token with `workflow` scope; subsequent edits can be pushed normally.

---

## Live URLs

* Frontend: `https://blog-frontend-723423022255.asia-southeast1.run.app`
* Backend: `https://blog-backend-723423022255.asia-southeast1.run.app`
* GitHub repo: `https://github.com/hafidz1999/cloud-fullstack-blog`

---

## How docs.html was generated

The `frontend/docs.html` is a trimmed and formatted copy of key README sections (Architecture, Deployment, CI/CD, Monitoring). It was manually copied from README during the finalization step so the webapp contains a human-friendly project report.

---

## Contact / Author

Hafidz Abdurrafi (GitHub: `hafidz1999`)

---

*End of README.*
