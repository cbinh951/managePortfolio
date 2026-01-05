# Deployment Guide

## Single-File Deployment with Fly.io

This project uses a **combined deployment configuration** that deploys both Frontend (Next.js) and Backend (Node.js/Express) in a single container. Both services run together using PM2 process manager.

### Architecture Overview

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
- ✅ Single deployment command
- ✅ Shared resources (more efficient)
- ✅ Internal communication (faster)
- ✅ Easier to manage
- ✅ Lower cost (1 VM instead of 2)

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

## Configuration Files

### `fly.toml` (Root Directory)

This is the main configuration file for Fly.io deployment:

```toml
# Fly.io configuration for combined Frontend + Backend deployment
app = 'manage-portfolio'
primary_region = 'sin'

[build]
  dockerfile = 'Dockerfile'
  [build.args]
    NEXT_PUBLIC_API_URL = 'http://localhost:3001'

[env]
  NODE_ENV = 'production'

# Frontend service (main)
[[services]]
  internal_port = 3000
  protocol = 'tcp'
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

  [[services.ports]]
    handlers = ['http']
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ['tls', 'http']
    port = 443

  [[services.http_checks]]
    interval = '30s'
    timeout = '5s'
    grace_period = '10s'
    method = 'GET'
    path = '/'

# Backend API service (internal)
[[services]]
  internal_port = 3001
  protocol = 'tcp'

  [[services.ports]]
    handlers = ['http']
    port = 8080

  [[services.http_checks]]
    interval = '30s'
    timeout = '5s'
    grace_period = '10s'
    method = 'GET'
    path = '/api/health'

# Persistent volume for backend data (CSV files)
[mounts]
  source = 'portfolio_data'
  destination = '/app/backend/data'

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

### `Dockerfile` (Root Directory)

Multi-stage build that creates a combined container:

1. **Stage 1:** Build backend (TypeScript compilation)
2. **Stage 2:** Build frontend (Next.js build)
3. **Stage 3:** Production runtime with PM2

Both services run simultaneously using PM2 process manager.

---

## Daily Operations

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

## Troubleshooting

### View Detailed Logs

```bash
# All logs
fly logs -f

# Filter by service
fly logs -f | grep "PM2"      # PM2 process manager
fly logs -f | grep "backend"  # Backend service
fly logs -f | grep "frontend" # Frontend service
```

### Check Health Status

```bash
fly checks list
```

### Access Container Shell

```bash
fly ssh console

# View PM2 status
pm2 status

# View filesystem
ls -la /app
ls -la /app/backend/data  # Check CSV files
```

### Common Issues

**Issue:** Volume not attached
```bash
# List volumes
fly volumes list

# Create volume if missing
fly volumes create portfolio_data --size 1 --region sin
```

**Issue:** Build fails
```bash
# Check if Dockerfile exists
ls -la Dockerfile

# Rebuild with verbose output
fly deploy --verbose
```

**Issue:** Services not starting
```bash
fly ssh console
pm2 logs
```

---

## Custom Domain

### Add Your Domain

```bash
# Add custom domain
fly certs create your-domain.com

# View certificate status
fly certs show your-domain.com
```

### DNS Configuration

Add these DNS records at your domain provider:

| Type  | Name | Value |
|-------|------|-------|
| CNAME | @    | manage-portfolio.fly.dev |
| CNAME | www  | manage-portfolio.fly.dev |

### Verify SSL Certificate

```bash
fly certs check your-domain.com
```

---

## Advanced Commands

```bash
# View app information
fly info

# List all your apps
fly apps list

# View volumes
fly volumes list

# Delete volume (⚠️ deletes data!)
fly volumes delete vol_xxx

# Destroy app (⚠️ permanent!)
fly apps destroy manage-portfolio

# View machine status
fly machine list

# Clone app to another region
fly regions add nrt  # Add Tokyo region
```

---

## Monitoring

### View Metrics

```bash
# Open monitoring dashboard
fly dashboard
```

### Set Up Alerts

Configure alerts in the Fly.io dashboard for:
- High CPU usage
- Memory exhausted  
- Service down
- Failed health checks

---

## Backup & Recovery

### Backup Data Volume

```bash
# SSH into container
fly ssh console

# Create backup
tar -czf /tmp/backup.tar.gz /app/backend/data

# Download backup (from local terminal)
fly ssh sftp get /tmp/backup.tar.gz ./backup.tar.gz
```

### Restore Data

```bash
# Upload backup
fly ssh sftp shell
put ./backup.tar.gz /tmp/backup.tar.gz
exit

# SSH and extract
fly ssh console
tar -xzf /tmp/backup.tar.gz -C /
pm2 restart backend
```

---

## Cost Optimization

To stay within free tier:

1. **Reduce memory to 256MB** (edit `fly.toml`):
   ```toml
   [[vm]]
     memory = '256mb'
   ```

2. **Enable auto-stop** (already configured):
   ```toml
   auto_stop_machines = true
   auto_start_machines = true
   min_machines_running = 0
   ```

3. **Use shared CPU** (already configured):
   ```toml
   cpu_kind = 'shared'
   ```

---

## Next Steps

- ✅ Deploy your application
- ✅ Test all features
- ✅ Set up custom domain (optional)
- ✅ Configure monitoring and alerts
- ✅ Schedule regular backups

For more information, visit [Fly.io Documentation](https://fly.io/docs/).
