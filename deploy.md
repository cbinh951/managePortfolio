## Alternative: Free Deployment with Fly.io

[Fly.io](https://fly.io) offers a generous free tier with 3 shared VMs, perfect for small projects.

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

### Step 3: Deploy Backend

```bash
# Navigate to backend folder
cd backend

# Launch app (first time setup)
fly launch --name portfolio-backend

# When prompted:
# - Choose a region close to you (e.g., sin for Singapore)
# - Don't setup PostgreSQL database (we use CSV files)
# - Don't deploy now (we need to configure first)
```

This creates a `fly.toml` file. Edit it:

```toml
# fly.toml in backend folder
app = 'portfolio-backend'
primary_region = 'sin'

[build]

[env]
  NODE_ENV = 'production'
  PORT = '3001'

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[mounts]
  source = 'backend_data'
  destination = '/app/data'
```

Create the volume for data persistence:

```bash
# Create a 1GB volume for CSV data
fly volumes create backend_data --size 1 --region sin
```

Deploy:

```bash
fly deploy
```

Get your backend URL:

```bash
fly status
# URL: https://portfolio-backend.fly.dev
```

### Step 4: Deploy Frontend

```bash
# Navigate to frontend folder
cd ../frontend

# Launch app
fly launch --name portfolio-frontend

# When prompted:
# - Choose same region as backend
# - Don't deploy now
```

Edit `fly.toml`:

```toml
# fly.toml in frontend folder
app = 'portfolio-frontend'
primary_region = 'sin'

[build]
  [build.args]
    NEXT_PUBLIC_API_URL = 'https://portfolio-backend.fly.dev'

[env]
  NODE_ENV = 'production'

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
```

Deploy:

```bash
fly deploy
```

### Step 5: Verify Deployment

```bash
# Check backend status
cd ../backend
fly status
fly logs

# Check frontend status
cd ../frontend
fly status
fly logs
```

Your apps are now live at:
- **Frontend:** `https://portfolio-frontend.fly.dev`
- **Backend:** `https://portfolio-backend.fly.dev`

---

## Fly.io Quick Reference

```bash
# View app status
fly status

# View logs
fly logs

# SSH into container
fly ssh console

# View app info
fly info

# Scale app
fly scale count 1

# Restart app
fly apps restart portfolio-backend

# Delete app
fly apps destroy portfolio-backend

# List all apps
fly apps list

# View volumes
fly volumes list
```

## Fly.io Free Tier Limits

| Resource | Free Allowance |
|----------|----------------|
| VMs | 3 shared-cpu-1x machines |
| Memory | 256MB per VM |
| Storage | 3GB total persistent volumes |
| Bandwidth | Unlimited outbound |
| SSL | ✅ Free automatic |

## Updating Your App on Fly.io

```bash
# After making code changes, just run:
cd backend
fly deploy

cd ../frontend
fly deploy
```

## Custom Domain on Fly.io

```bash
# Add custom domain
fly certs create your-domain.com

# Add CNAME record in your DNS:
# your-domain.com → portfolio-frontend.fly.dev

# Verify certificate
fly certs show your-domain.com
```
