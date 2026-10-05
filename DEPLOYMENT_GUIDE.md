# 🚀 DAV University Medical Leave Portal — Deployment Guide

This guide walks you through deploying the **Frontend on Vercel** and the **Backend on Render**, along with setting up a **free keep-alive cron job** so your Render backend never goes to sleep.

---

## 📁 1. Project Directory Structure

Your workspace has been organized into two independent, clean folders:

```
MED REC/
│
├── frontend/                        # ⚡ Next.js 14 Web Application (Deploy to VERCEL)
│   ├── src/                         # Pages, UI components, context & styling
│   │   ├── app/                     # Next.js App Router (dashboard, track, admin, etc.)
│   │   ├── components/              # UI components
│   │   ├── context/                 # Auth context
│   │   ├── lib/                     # Client utilities (data, template engine)
│   │   └── types/                   # TypeScript interfaces
│   ├── public/                      # Static icons, logos, university seal
│   ├── package.json                 # Frontend dependencies (React, Next, Tailwind, Lucide)
│   ├── next.config.mjs              # Smart API rewrites to Render backend
│   ├── tailwind.config.js           # Styling tokens & themes
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vercel.json                  # Vercel configuration
│   ├── .env.example                 # Example frontend environment variables
│   └── .env.local                   # Local frontend development config
│
├── backend/                         # 🛠️ Express.js Production Backend (Deploy to RENDER)
│   ├── routes/                      # Modular API routes
│   │   ├── auth.js                  # /api/auth/login
│   │   ├── applications.js          # /api/applications (GET, POST, PATCH)
│   │   ├── stats.js                 # /api/stats
│   │   ├── students.js              # /api/students
│   │   ├── template.js              # /api/template
│   │   ├── track.js                 # /api/track
│   │   ├── sync.js                  # /api/sync/*
│   │   ├── admin.js                 # /api/admin/*
│   │   └── proofs.js                # /api/delete-cloudinary-proof, /medical-proofs/*
│   ├── services/                    # Business logic & integrations
│   │   ├── db.js                    # In-memory & JSON file persistent store
│   │   ├── firebase.js              # Firebase Firestore source of truth
│   │   ├── cloudinary.js            # Proof upload & verified deletion
│   │   ├── proofSync.js             # Local filesystem proof sync & verification
│   │   └── keepAliveCron.js         # Internal automated keep-alive self-pinger
│   ├── data/                        # Persistent store (dav_portal_data.json)
│   ├── medical-proofs/              # Verified local document storage
│   ├── package.json                 # Express, Cors, Firebase Admin, Cloudinary, JSZip
│   ├── server.js                    # Main server entry with /health endpoint
│   ├── render.yaml                  # 1-Click Render Blueprint configuration
│   ├── .env.example                 # Backend environment variables template
│   └── .env                         # Local backend configuration
│
└── DEPLOYMENT_GUIDE.md              # 📖 This complete guide
```

---

## 📋 2. Pre-Requisites

Before starting, create free accounts on:
1. **GitHub** ([github.com](https://github.com/)) — to host your codebase
2. **Render** ([render.com](https://render.com/)) — for hosting the Node.js backend
3. **Vercel** ([vercel.com](https://vercel.com/)) — for hosting the Next.js frontend
4. **cron-job.org** ([cron-job.org](https://cron-job.org/)) *(or UptimeRobot)* — free ping service to keep Render awake 24/7

---

## 🛠️ PART 1: Deploy Backend to Render

### Step 1.1: Push Project to GitHub
Initialize git and push your workspace to a GitHub repository:
```bash
git init
git add .
git commit -m "feat: separate frontend and backend for Vercel and Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dav-medical-leave-portal.git
git push -u origin main
```

---

### Step 1.2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** (top right) ➔ Select **Web Service**.
3. Choose **Build and deploy from a Git repository** ➔ Select your repository.
4. Fill in the deployment details:
   - **Name**: `dav-medical-portal-backend` *(or any unique name)*
   - **Region**: `Oregon (US West)` *(or Frankfurt/Singapore)*
   - **Branch**: `main`
   - **Root Directory**: `backend`  *(⚠️ Important! Enter `backend` here)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

---

### Step 1.3: Set Environment Variables on Render
Scroll down to the **Environment Variables** section and click **Add Environment Variable**:

| Key | Value / Instructions |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` *(update once Vercel is deployed)* |
| `RENDER_EXTERNAL_URL` | `https://dav-medical-portal-backend.onrender.com` *(your Render service URL)* |
| `CLOUDINARY_CLOUD_NAME` | `dweh0bphw` *(or your Cloudinary name)* |
| `CLOUDINARY_API_KEY` | `938717562367499` *(or your Cloudinary key)* |
| `CLOUDINARY_API_SECRET` | `Vd0FH7P9Ts5-_4iygJZQAbJE084` *(or your Cloudinary secret)* |
| `FIREBASE_PROJECT_ID` | `dav-university-medical-reports` |
| `FIREBASE_CLIENT_EMAIL` | *(From your serviceAccountKey.json)* |
| `FIREBASE_PRIVATE_KEY` | *(From your serviceAccountKey.json, including `-----BEGIN...`)* |

> 💡 **Firebase Shortcut on Render**: Instead of copying long private keys, you can simply upload your `serviceAccountKey.json` directly under **Environment** ➔ **Secret Files** on Render, with filename `serviceAccountKey.json`!

---

### Step 1.4: Configure Health Check Path
Under **Advanced**:
- **Health Check Path**: `/health`

Click **Deploy Web Service**.
Within 1-2 minutes, Render will output:
```
[DAV Medical Portal Backend] Running on port: 10000
[Health Endpoint] http://localhost:10000/health
==> Your service is live 🎉 at https://dav-medical-portal-backend.onrender.com
```

### Step 1.5: Test Backend URL
Open `https://dav-medical-portal-backend.onrender.com/health` in your browser.
You should see:
```json
{
  "status": "ok",
  "service": "DAV University Medical Leave Portal Backend",
  "environment": "production",
  "uptime": "25s",
  "timestamp": "2026-10-05T06:15:00.000Z",
  "message": "Server is online, responsive, and ready."
}
```
**Copy your backend URL!** You will need it for Vercel and the cron job.

---

## ⏰ PART 2: Apply Cron Job So Render Never Dies

Render's free tier automatically suspends (spins down) web services after **15 minutes** of inactivity, which causes a 40-50 second delay on the next user's visit.

We prevent this using a **Free 10-Minute External Cron Job** (guarantees 100% 24/7 uptime at zero cost):

### Option A: Using cron-job.org (Recommended - 100% Free Forever)
1. Go to [https://cron-job.org/en/](https://cron-job.org/en/) and sign up for a free account.
2. In the dashboard, click **Create Cronjob**.
3. Fill in:
   - **Title**: `DAV Medical Backend Keep-Alive`
   - **URL**: `https://dav-medical-portal-backend.onrender.com/health` *(replace with your actual Render URL)*
   - **Execution Schedule**: Select **Every 10 minutes**
   - **Request Method**: `GET`
4. Under **Failure Notifications**, you can optionally check "Send notification on error".
5. Click **Create**.

### Option B: Using UptimeRobot (Free Alternative)
1. Go to [https://uptimerobot.com/](https://uptimerobot.com/) and create a free account.
2. Click **+ Add New Monitor**.
3. Choose:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `DAV Medical Portal Backend`
   - **URL (or IP)**: `https://dav-medical-portal-backend.onrender.com/health`
   - **Monitoring Interval**: `Every 5 minutes`
4. Click **Create Monitor**.

### How It Works:
- Render sleeps after **15 minutes** of no HTTP requests.
- The cron job visits `/health` every **10 minutes** (or 5 minutes).
- Render's internal timer is constantly refreshed, keeping your server running **24 hours a day, 7 days a week, 365 days a year**!

---

## ⚡ PART 3: Deploy Frontend to Vercel

### Step 3.1: Import Project in Vercel
1. Log in to [vercel.com](https://vercel.com/).
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository (`dav-medical-leave-portal`) and click **Import**.

---

### Step 3.2: Configure Root Directory
Under **Project Settings**:
- **Framework Preset**: `Next.js`
- **Root Directory**: Click **Edit** and select `frontend` *(⚠️ Crucial! Points Vercel to the frontend directory)*.

---

### Step 3.3: Set Environment Variables on Vercel
Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://dav-medical-portal-backend.onrender.com` *(Your Render backend URL without trailing slash)* |

---

### Step 3.4: Deploy
Click **Deploy**.
Vercel will build the Next.js frontend in ~45 seconds and give you a live production URL:
`https://dav-medical-leave-portal.vercel.app`

---

### Step 3.5: Update Backend CORS on Render
Once you have your Vercel URL:
1. Go back to Render Dashboard ➔ `dav-medical-portal-backend` ➔ **Environment**.
2. Update `FRONTEND_URL` to your live Vercel URL (e.g. `https://dav-medical-leave-portal.vercel.app`).
3. Click **Save Changes**. (Render will automatically redeploy).

---

## 🔄 How the Frontend ➔ Backend Connection Works

In `frontend/next.config.mjs`, we configured Next.js Edge rewrites:
```javascript
async rewrites() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  return [
    {
      source: "/api/:path*",
      destination: `${backendUrl}/api/:path*`,
    },
    {
      source: "/medical-proofs/:path*",
      destination: `${backendUrl}/medical-proofs/:path*`,
    },
    {
      source: "/health",
      destination: `${backendUrl}/health`,
    },
  ];
}
```

### Why this is the best architecture:
1. **Zero CORS Issues**: Browser requests go to `/api/...` on the same domain; Vercel edge proxies to Render behind the scenes.
2. **No Code Rewrite**: All frontend components use simple `fetch('/api/applications')` without hardcoding server URLs.
3. **Ultra-Fast Edge Performance**: Static pages and UI assets load globally via Vercel's Edge Network, while dynamic data queries execute on Render.

---

## 💻 Local Development Workflow

To run both services on your local machine:

### Terminal 1: Run Backend (Port 5000)
```powershell
cd "d:\MED REC\backend"
npm.cmd start
```
*Backend runs on `http://localhost:5000`*

### Terminal 2: Run Frontend (Port 3000)
```powershell
cd "d:\MED REC\frontend"
npm.cmd run dev
```
*Frontend runs on `http://localhost:3000` and automatically proxies `/api/*` to `http://localhost:5000`!*

---

## ✅ Deployment Checklist

- [x] Separate `frontend/` folder created with clean Next.js app and API rewrites
- [x] Separate `backend/` folder created with production Express server
- [x] Health check endpoint `/health` tested and operational
- [x] Built-in keep-alive cron worker installed in `backend/services/keepAliveCron.js`
- [x] External cron setup instructions provided for `cron-job.org` & `UptimeRobot`
- [x] Render deployment blueprint `render.yaml` created
- [x] Vercel configuration `vercel.json` created
- [x] Full step-by-step instructions documented in `DEPLOYMENT_GUIDE.md`
