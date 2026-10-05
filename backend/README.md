# DAV University Medical Portal - Backend Service

Production-ready Express.js API backend service configured for deployment on **Render** (Free Tier) with automated keep-alive cron job integration so it never spins down.

---

## 🚀 Features

- **Express 4.x REST API**: Complete endpoints for authentication, applications, status reviews, student rosters, template editing, and analytics.
- **Firebase Firestore Integration**: Permanent storage with support for both `serviceAccountKey.json` file or cloud environment variables.
- **Cloudinary Integration**: Secure upload and deletion of student medical proof certificates.
- **Local / Admin Proof Synchronization**: Secure verification and download packaging.
- **Never-Sleep Keep-Alive Cron**: Automated HTTP/HTTPS ping routine every 14 minutes against `/health` to prevent Render's free tier 15-minute inactivity spin down.
- **CORS Configured**: Pre-configured to accept requests from your Vercel frontend domain.

---

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. **Start local server**:
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

4. **Verify health**:
   Open [http://localhost:5000/health](http://localhost:5000/health) in your browser.

---

## 🌐 Deploy to Render (Step-by-Step)

### Step 1: Create a GitHub Repository
Push your project to GitHub (either the whole monorepo or just the `backend` folder).

### Step 2: Create a New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `dav-medical-portal-backend`
   - **Region**: Oregon (US West) or closest to your users
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: `backend` *(Leave blank if backend is its own repository)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables in Render
In the Render dashboard under **Environment**:
| Variable Name | Value / Description |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (your Vercel URL) |
| `RENDER_EXTERNAL_URL` | `https://dav-medical-portal-backend.onrender.com` (your Render URL) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret |
| `FIREBASE_PROJECT_ID` | `dav-university-medical-reports` |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase Admin Service Account Email |
| `FIREBASE_PRIVATE_KEY` | Your Firebase Private Key (`"-----BEGIN PRIVATE KEY-----\n..."`) |

*(Alternative for Firebase: Upload `serviceAccountKey.json` directly under **Environment** -> **Secret Files** on Render).*

### Step 4: Configure Health Check Path
Under **Advanced**:
- **Health Check Path**: `/health`

Click **Create Web Service**. Render will deploy your service within 2 minutes!

---

## ⏰ Keep-Alive Cron Setup (So It Never Dies)

Render free instances go to sleep after 15 minutes of inactivity. To ensure 100% 24/7 uptime with zero spin-down lag:

### Method 1: Built-in Self-Pinger (Automatic)
Once you set the `RENDER_EXTERNAL_URL=https://your-backend.onrender.com` environment variable, the server automatically pings its own `/health` endpoint every 14 minutes.

### Method 2: External Cron Service (100% Guaranteed & Recommended)
Free external pinging guarantees incoming public HTTP traffic:

1. Go to [cron-job.org](https://cron-job.org/) (100% free) or [UptimeRobot](https://uptimerobot.com/).
2. Create a free account and click **Create Cronjob**.
3. Fill in:
   - **Title**: `DAV Medical Backend Keep-Alive`
   - **URL**: `https://your-backend-name.onrender.com/health`
   - **Execution Schedule**: Every **10 minutes**
   - **Request Method**: `GET`
4. Click **Create**.
Your Render backend will now stay awake 24/7/365 with ZERO cold starts!
