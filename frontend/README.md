# DAV University Medical Portal - Frontend

Modern, responsive Next.js 14 web application for students and faculty of DAV University, optimized for deployment on **Vercel**.

---

## 🚀 Features

- **Next.js 14 App Router**: Instant client-side page transitions with rich UI animations.
- **Student Portal**: Medical leave application submission, tracking, printable university letter generator, and document uploads.
- **Admin Dashboard**: Verification desk, application reviews, medical proof synchronization, template customizer, and analytics.
- **Transparent API Rewriting**: All relative `/api/*` and `/medical-proofs/*` requests are proxied via Vercel's Edge layer to your Render backend with zero CORS issues.
- **Zero Serverless Limitations**: No filesystem lockups or function timeout constraints.

---

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

---

## 🌐 Deploy to Vercel (Step-by-Step)

### Step 1: Push to GitHub
Commit and push your project to GitHub (either the whole repository or just the `frontend` directory).

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository and click **Import**.

### Step 3: Configure Project Settings
- **Project Name**: `dav-medical-leave-portal` (or your choice)
- **Framework Preset**: `Next.js`
- **Root Directory**: Click **Edit** and choose `frontend` *(Leave as `./` if frontend is its own repo)*
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 4: Add Environment Variables
Expand the **Environment Variables** section and add:
| Key | Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-backend-service.onrender.com` (Your deployed Render backend URL) |

### Step 5: Deploy
Click **Deploy**. Vercel will build and deploy your application in under 60 seconds!
Your live website will be available at `https://your-project.vercel.app`.
