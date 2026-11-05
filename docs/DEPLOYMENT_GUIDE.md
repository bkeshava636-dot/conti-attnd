# Production Online Deployment Guide
## Contineo Attendance Tracker (BITM)

This project is packaged to deploy as a unified full-stack application (React Frontend + Node.js API + Contineo Simulator + Database) on any cloud provider.

---

## ⚡ Option 1: Render.com (Recommended — 100% Free & Ready)

Render provides free hosting for fullstack Node.js web services with automatic HTTPS.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/conti-attnd.git
   git branch -M main
   git push -u origin main
   ```
2. **Go to Render**:
   - Visit [dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
3. **Create a Blueprint / New Web Service**:
   - Click **New +** $\rightarrow$ **Blueprint** (or **Web Service**).
   - Select your `conti-attnd` repository.
   - Render will automatically detect `render.yaml`!
4. **Environment Variables**:
   - `PROCTOR_SECRET_KEY`: Set your proctor security passphrase.
   - *(Optional)* `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: If using Supabase. (If left empty, the built-in storage engine runs automatically).
5. **Click Apply / Deploy**:
   - In 2–3 minutes, Render gives you a live HTTPS URL:
     ```
     https://contineo-attendance-tracker.onrender.com
     ```

---

## ⚡ Option 2: Railway (1-Click Deployment)

1. Go to [railway.app](https://railway.app) and click **Start a New Project**.
2. Select **Deploy from GitHub repo** and choose your repository.
3. Under **Variables**, add:
   - `PROCTOR_SECRET_KEY` = your secret
   - `PORT` = `5000`
4. Railway will automatically build the `Dockerfile` and give you a live production URL:
   ```
   https://contineo-attendance-tracker.up.railway.app
   ```

---

## ⚡ Option 3: Vercel

1. Install Vercel CLI or import repository at [vercel.com](https://vercel.com).
2. The provided `vercel.json` routes `/api/*` to the serverless backend and `/` to the React build.
3. Run:
   ```bash
   npx vercel
   ```

---

## ⚡ Option 4: Deploy Anywhere with Docker

A production multi-stage `Dockerfile` is included in the project root.
To build and run locally or push to AWS ECS / Google Cloud Run / DigitalOcean:
```bash
docker build -t contineo-attendance-tracker .
docker run -p 5000:5000 -e PROCTOR_SECRET_KEY="your-secret-key" contineo-attendance-tracker
```

---

## 🔌 Updating the Chrome Extension to Use the Live Server

Once deployed online:
1. Open the Chrome Extension popup by clicking the extension icon.
2. Click the **Settings Gear Icon** (⚙).
3. Change **Backend Server URL** from `http://localhost:5000` to your live domain:
   ```
   https://contineo-attendance-tracker.onrender.com
   ```
4. Enter your production **Proctor Auth Key**.
5. Click **Save & Reconnect**.
6. The extension indicator will turn green (`Backend: Connected`). Proctors on campus can now sync attendance directly to your cloud server from any computer!
