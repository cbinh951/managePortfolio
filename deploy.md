# Deployment Guide

## Deployment Options

This project supports two cloud deployment platforms:

1. **Render.com** (Recommended - Simpler setup, great free tier)
2. **Fly.io** (Alternative - More control, auto-scaling)

Both options deploy Frontend (Next.js) and Backend (Express) in a single Docker container using PM2 process manager.

---

# Option 1: Deploy to Render.com (Recommended)

[Render.com](https://render.com) offers a generous free tier with 750 hours/month, making it perfect for personal projects.

## Architecture Overview

```
┌──────────────────────────────────┐
│   Render Web Service             │
│   (manage-portfolio)             │
│                                  │
│  ┌─────────┐    ┌──────────┐   │
│  │Frontend │    │ Backend  │   │
│  │(Next.js)│◄──►│(Express) │   │
│  │Port:3000│    │Port:3001 │   │
│  └─────────┘    └──────────┘   │
│                                  │
│  PM2 Process Manager             │
│  Persistent Disk: /backend/data  │
└──────────────────────────────────┘
```

**Benefits:**
- ✅ Free tier: 512MB RAM, 750 hours/month
- ✅ Automatic HTTPS/SSL certificates
- ✅ Git-based auto-deployments
- ✅ Infrastructure as Code (render.yaml)
- ✅ Built-in monitoring & logs
- ✅ Easy rollbacks

---

## Prerequisites

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub, GitLab, or email
3. Verify your email address

---

## Deployment Methods

Render offers two deployment methods:

### Method A: Using Infrastructure as Code (Recommended)

This method uses the included `render.yaml` file for automated setup.

#### 1. Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/manage-portfolio.git
git branch -M main
git push -u origin main
```

#### 2. Create New Blueprint on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select `manage-portfolio` repository
5. Render will automatically detect `render.yaml`
6. Click **"Apply"**

#### 3. Configure Persistent Disk

After the service is created:

1. Go to your service dashboard
2. Navigate to **"Disks"** tab
3. Add disk:
   - **Name**: `portfolio-data`
   - **Mount Path**: `/app/backend/data`
   - **Size**: 1GB
4. Click **"Save"**

#### 4. Set Environment Variables (Optional)

If needed, add environment variables:

1. Go to **"Environment"** tab
2. Add variables:
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_API_URL` = `http://localhost:3001`
3. Click **"Save Changes"**

#### 5. Deploy

Render will automatically build and deploy your application. You can monitor progress in the **"Logs"** tab.

Your app will be available at:
- **URL**: `https://manage-portfolio.onrender.com`

---

### Method B: Manual Dashboard Setup

If you prefer manual setup or `render.yaml` doesn't work:

#### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Select `manage-portfolio` repository

#### 2. Configure Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `manage-portfolio` |
| **Region** | Oregon (US West) - Free tier |
| **Branch** | `main` |
| **Runtime** | Docker |
| **Instance Type** | Free (512 MB RAM, 0.1 CPU) |
| **Dockerfile Path** | `./Dockerfile` |
| **Docker Command** | *(Leave empty, uses Dockerfile CMD)* |

#### 3. Add Environment Variables

In the **Environment Variables** section:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |

#### 4. Create Persistent Disk

1. Scroll to **"Disk"** section
2. Click **"Add Disk"**:
   - **Name**: `portfolio-data`
   - **Mount Path**: `/app/backend/data`
   - **Size**: 1GB
3. Click **"Save"**

#### 5. Deploy

Click **"Create Web Service"** to start the deployment.

---

## Verify Deployment

### Check Build Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. Watch for:
   ```
   ✓ Backend build completed
   ✓ Frontend build completed
   ✓ PM2 started both services
   ```

### Test Your Application

1. **Frontend**: Visit `https://manage-portfolio.onrender.com`
2. **Backend API**: Test `https://manage-portfolio.onrender.com/api/health`
3. **Create Test Data**: Add a portfolio or transaction
4. **Verify Persistence**: Restart service and check data still exists

---

## Daily Operations

### Update Your App

```bash
# Make code changes
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically detect the push and redeploy.

### Manual Redeploy

1. Go to your service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### View Logs

```bash
# Real-time logs in dashboard
Dashboard → Your Service → Logs tab

# Or use Render CLI
render logs
```

### Restart Service

1. Dashboard → Your Service
2. Click **"Manual Deploy"** → **"Suspend"**
3. Then click **"Resume"**

### Rollback to Previous Version

1. Dashboard → Your Service → **"Events"** tab
2. Find previous successful deploy
3. Click **"Rollback to this version"**

---

## Render Free Tier Limits

| Resource | Free Allowance |
|----------|----------------|
| Web Services | 750 hours/month |
| RAM | 512 MB per service |
| CPU | Shared (0.1 CPU) |
| Bandwidth | 100 GB/month |
| Build Minutes | 500 minutes/month |
| Persistent Disk | Free (up to 1GB recommended) |
| SSL/HTTPS | ✅ Free automatic |
| Auto-deploy | ✅ Included |

> [!NOTE]
> Free tier services automatically sleep after 15 minutes of inactivity and wake up on the next request (may take 30-60 seconds).

---

## Custom Domain

### Add Your Domain

1. Dashboard → Your Service → **"Settings"**
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `portfolio.yourdomain.com`)

### DNS Configuration

Add these DNS records at your domain provider:

| Type  | Name | Value |
|-------|------|-------|
| CNAME | portfolio | manage-portfolio.onrender.com |

### Verify SSL Certificate

Render automatically provisions SSL certificates via Let's Encrypt within a few minutes.

---

## Troubleshooting

### Build Fails

**Issue**: Docker build errors

**Solution**:
1. Check build logs in dashboard
2. Verify `Dockerfile` exists in root
3. Ensure all dependencies are listed in `package.json`
4. Try building locally first: `docker build -t test .`

### Service Won't Start

**Issue**: PM2 or processes not starting

**Solution**:
1. Check runtime logs
2. SSH into service (if available on your plan)
3. Verify `start.sh` is executable
4. Check PM2 ecosystem config

### Data Not Persisting

**Issue**: CSV files lost after restart

**Solution**:
1. Verify disk is mounted at `/app/backend/data`
2. Check disk size in dashboard
3. Ensure backend writes to correct path
4. Review logs for permission errors

### Slow First Load

**Issue**: App takes 30-60 seconds to respond

**Cause**: Free tier services sleep after 15 minutes of inactivity

**Solutions**:
- Upgrade to paid plan (stays always active)
- Use external uptime monitor to ping your app every 10 minutes
- Accept the sleep behavior for low-traffic apps

---

## Advanced: Render CLI

### Install Render CLI

```bash
# macOS/Linux
brew install render

# Or download from: https://render.com/docs/cli
```

### Login

```bash
render login
```

### Common Commands

```bash
# List services
render services list

# View logs
render logs

# Deploy latest code
render deploy

# Open dashboard
render open
```

---

# Option 2: Deploy to Fly.io (Alternative)

[Fly.io](https://fly.io) offers more control and worldwide edge deployment with auto-scaling capabilities.

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Fly.io Container (manage-portfolio)│
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Frontend    │  │  Backend    │ │
│  │  (Next.js)   │  │  (Express)  │ │
│  │  Port: 3000  │  │  Port: 3001 │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│  PM2 Process Manager                │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Faster cold starts
- ✅ Auto-scaling capabilities
- ✅ Edge deployment (closer to users)
- ✅ More control over infrastructure

---

## Prerequisites

### Step 1: Install Fly CLI

```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login to Fly.io

```bash
# This will open browser for authentication
fly auth login

# Or signup if you don't have an account
fly auth signup
```

---

## Initial Deployment

### Step 3: Launch Your App (First Time Only)

```bash
# From the project root directory
fly launch --name manage-portfolio

# When prompted:
# - Choose a region close to you (e.g., sin for Singapore)
# - Don't setup PostgreSQL database (we use CSV files)
# - Choose 'Yes' to deploy now OR 'No' if you want to review config first
```

> [!IMPORTANT]
> The `fly.toml` configuration file already exists in the project root with optimized settings for both frontend and backend.

### Step 4: Create Data Volume (First Time Only)

Create a persistent volume for storing CSV data:

```bash
# Create a 1GB volume for backend data
fly volumes create portfolio_data --size 1 --region sin
```

> [!NOTE]
> Replace `sin` with your chosen region (e.g., `nrt` for Tokyo, `lax` for Los Angeles).

### Step 5: Configure Environment Variables

Set the API URL for production:

```bash
fly secrets set NEXT_PUBLIC_API_URL=https://manage-portfolio.fly.dev
```

### Step 6: Deploy

```bash
# From the project root directory
fly deploy
```

The deployment process will:
1. Build the backend (TypeScript → JavaScript)
2. Build the frontend (Next.js production build) 
3. Create a production container with both services
4. Start both services using PM2
5. Deploy to Fly.io

---

## Verify Deployment

### Check App Status

```bash
fly status
```

### View Live Logs

```bash
# View all logs
fly logs

# Follow logs in real-time
fly logs -f

# View backend logs only
fly logs -f | grep "backend"

# View frontend logs only  
fly logs -f | grep "frontend"
```

### Test Your Application

Your app is now live at:
- **Application URL:** `https://manage-portfolio.fly.dev`
- **Backend API:** `https://manage-portfolio.fly.dev:8080/api` (exposed on port 8080)

> [!TIP]
> The frontend is served on port 443 (HTTPS), and the backend API is accessible on port 8080.

---

## Daily Operations (Fly.io)

### Update Your App

After making code changes:

```bash
# From the project root directory
fly deploy
```

This single command redeploys both frontend and backend.

### Restart the App

```bash
fly apps restart manage-portfolio
```

### SSH Into the Container

```bash
fly ssh console

# Once inside, you can:
pm2 list              # View running processes
pm2 logs backend      # View backend logs
pm2 logs frontend     # View frontend logs
pm2 restart all       # Restart both services
```

### Scale Resources

```bash
# Scale memory
fly scale memory 1024  # 1GB RAM

# Scale to multiple machines
fly scale count 2
```

---

## Fly.io Free Tier Limits

| Resource | Free Allowance |
|----------|----------------|
| VMs | 3 shared-cpu-1x machines |
| Memory | 256MB per VM (upgraded to 512MB in config) |
| Storage | 3GB total persistent volumes |
| Bandwidth | Unlimited outbound |
| SSL | ✅ Free automatic |

> [!WARNING]
> The configuration uses 512MB memory which exceeds the free tier's 256MB. You may incur minimal charges. To use free tier only, edit `fly.toml` and change `memory = '256mb'`.

---

## Platform Comparison

| Feature | Render.com | Fly.io |
|---------|------------|--------|
| **Free Tier RAM** | 512 MB | 256 MB (3x machines) |
| **Free Hours** | 750/month | Always on |
| **Auto-sleep** | Yes (15 min) | No |
| **Setup Complexity** | Easy | Medium |
| **Cold Start Speed** | 30-60s | 1-3s |
| **Edge Deployment** | No | Yes |
| **Auto-scaling** | Paid only | Free tier limited |
| **Infrastructure as Code** | render.yaml | fly.toml |
| **Best For** | Simple projects | Performance-critical |

---

## Recommendation

- **Choose Render** if you want:
  - Simplest setup
  - Don't mind slow cold starts
  - Prefer web-based configuration
  - Want Infrastructure as Code with render.yaml

- **Choose Fly.io** if you want:
  - Faster response times
  - Edge deployment
  - More control over infrastructure
  - Always-on free tier (with limits)

Both platforms are excellent and support the exact same Docker configuration!

---

## Next Steps

1. ✅ Choose your deployment platform (Render or Fly.io)
2. ✅ Follow the appropriate setup steps above
3. ✅ Deploy your application
4. ✅ Test all features
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring

For more help:
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Fly.io Docs**: [fly.io/docs](https://fly.io/docs)
