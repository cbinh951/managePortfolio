# Docker Deployment Guide

## Project Structure

```
managePortfolio/
├── backend/
│   └── Dockerfile          ← Required for Dokploy
├── frontend/
│   └── Dockerfile          ← Required for Dokploy
└── DOCKER.md               ← This documentation
```

## Production Deployment on VPS Ubuntu with Dokploy

[Dokploy](https://dokploy.com/) is an open-source, self-hosted PaaS (Platform as a Service) that makes deployment easy with a beautiful UI.

### Step 1: Connect to Your VPS

```bash
# Connect via SSH (replace with your VPS IP and username)
ssh root@your-vps-ip

# Or with SSH key
ssh -i ~/.ssh/your-key.pem ubuntu@your-vps-ip
```

### Step 2: Update System Packages

```bash
# Update package list
sudo apt-get update

# Upgrade existing packages
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y curl git wget nano ufw
```

### Step 3: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Dokploy dashboard port
sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

### Step 4: Install Dokploy

```bash
# One-line installation (as root)
curl -sSL https://dokploy.com/install.sh | sh
```

This will:
- Install Docker (if not installed)
- Install Docker Compose
- Set up Dokploy with Traefik as reverse proxy
- Create admin account

After installation, you'll see:
```
Dokploy is now running!
Access the dashboard at: http://YOUR_VPS_IP:3000
```

### Step 5: Access Dokploy Dashboard

1. Open browser: `http://YOUR_VPS_IP:3000`
2. Create your admin account (first-time setup)
3. Login to the dashboard

### Step 6: Create a New Project

1. Click **"Create Project"**
2. Enter project name: `manage-portfolio`
3. Click **"Create"**

### Step 7: Deploy Backend Service

> **Note:** Both Frontend and Backend are in the same repository (monorepo). You'll deploy them as separate services pointing to the same repo but with different build paths.

1. Inside your project, click **"Add Service"** → **"Application"**
2. Configure:
   - **Name:** `backend`
   - **Source:** **Git** → Connect your GitHub/GitLab

3. Git Configuration:
   - Repository: `your-username/managePortfolio`
   - Branch: `main`
   - Build Path: `/backend` (path to backend folder)
   - Dockerfile Path: `./Dockerfile` (relative to Build Path)

4. Go to **"Environment"** tab and add:
   ```
   NODE_ENV=production
   PORT=3001
   ```

5. Go to **"Domains"** tab:
   - Add domain: `api.your-domain.com` (or leave empty for IP access)
   - Port: `3001`

6. Go to **"Advanced"** → **"Volumes"**:
   - Click **"Add Mount"**
   - Select **"Volume Mount"** (recommended for data persistence)
   - Configure:
     - **Volume Name:** `backend-data` (any name you prefer)
     - **Mount Path:** `/app/data`
   
   > **Mount Types Explained:**
   > - **Volume Mount:** Docker-managed storage, best for data persistence. Data survives container restarts/rebuilds.
   > - **Bind Mount:** Maps to a specific host folder (e.g., `/home/user/data`). Use if you need direct host access.
   > - **File Mount:** Mount a single file (e.g., config files).

7. Click **"Deploy"**

### Step 8: Deploy Frontend Service

1. Click **"Add Service"** → **"Application"**
2. Configure:
   - **Name:** `frontend`
   - **Source:** **Git** → Select the **same repository**

3. Git Configuration (same repo, different build path):
   - Repository: `your-username/managePortfolio` (same repo)
   - Branch: `main`
   - Build Path: `/frontend` (path to frontend folder)
   - Dockerfile Path: `./Dockerfile` (relative to Build Path)

4. Go to **"Environment"** tab and add:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://api.your-domain.com
   ```
   Or if using IP:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3001
   ```

5. Go to **"Domains"** tab:
   - Add domain: `your-domain.com` (or leave empty)
   - Port: `3000`

6. Click **"Deploy"**

### Step 9: Configure SSL (Automatic with Dokploy)

Dokploy uses Traefik which automatically handles SSL certificates via Let's Encrypt!

1. Go to **Settings** → **Server**
2. Ensure your domain DNS points to VPS IP
3. In each service's **"Domains"** tab:
   - Enable **"HTTPS"**
   - Dokploy will auto-generate SSL certificates

### Step 10: Set Up Custom Domain (Optional)

1. Point your domain to VPS:
   - `your-domain.com` → A Record → `YOUR_VPS_IP`
   - `api.your-domain.com` → A Record → `YOUR_VPS_IP`

2. In Dokploy, update domain settings for each service
3. SSL will be auto-configured

---

## Dokploy Dashboard Features

### Monitoring
- View real-time logs for each service
- Monitor resource usage (CPU, Memory)
- Check deployment status

### Deployments
- One-click redeploy
- Rollback to previous versions
- Auto-deploy on git push (webhooks)

### Database (Optional)
Dokploy can also manage databases:
1. Click **"Add Service"** → **"Database"**
2. Choose: PostgreSQL, MySQL, MongoDB, Redis, etc.
3. Connect from your backend using internal network

---

## Quick Reference - Dokploy CLI

```bash
# Check Dokploy status
docker ps | grep dokploy

# View Dokploy logs
docker logs dokploy -f

# Restart Dokploy
docker restart dokploy

# Update Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# Backup Dokploy data
docker exec dokploy dokploy backup

# Access Dokploy container
docker exec -it dokploy sh
```

## Troubleshooting Dokploy

### Cannot access dashboard
```bash
# Check if Dokploy is running
docker ps | grep dokploy

# Check logs
docker logs dokploy

# Restart Dokploy
docker restart dokploy
```

### Deployment fails
1. Check build logs in Dokploy dashboard
2. Verify Dockerfile paths are correct
3. Check environment variables

### SSL not working
1. Ensure domain DNS is properly configured
2. Wait for DNS propagation (5-30 minutes)
3. Check Traefik logs: `docker logs traefik`

### Service not accessible
1. Check if container is running in Dokploy dashboard
2. Verify port configuration
3. Check firewall rules: `sudo ufw status`

## Data Persistence

- Backend data (CSV files) is stored in a Docker volume
- Configure volume mount in Dokploy: `/app/data`
- To backup data:

```bash
# Find container name
docker ps | grep backend

# Backup
docker cp <container-name>:/app/data ./backup-data

# Restore
docker cp ./backup-data/. <container-name>:/app/data/
```

## Health Checks

- Backend: `http://YOUR_VPS_IP:3001/api/health`
- Frontend: `http://YOUR_VPS_IP:3000`
