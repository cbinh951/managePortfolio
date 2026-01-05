# VPS Deployment Guide - Docker Compose

## Prerequisites

- Ubuntu VPS (20.04 or 22.04 recommended)
- At least 1GB RAM
- SSH access to your VPS
- Domain name (optional, for SSL)

---

## Quick Start

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or: ssh username@your-vps-ip
```

### 2. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### 3. Clone Your Repository

```bash
# Install git if not already installed
sudo apt install git -y

# Clone your repo
git clone https://github.com/YOUR_USERNAME/manage-portfolio.git
cd manage-portfolio
```

### 4. Deploy with Docker Compose

```bash
# Build and start containers
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Your app is now running on:
- **Frontend**: `http://your-vps-ip:3000`
- **Backend API**: `http://your-vps-ip:3001`

---

## Production Setup with SSL (Recommended)

### Option 1: Simple - Direct Access (No Domain)

If you don't have a domain, access via IP:
```
http://YOUR_VPS_IP:3000
```

To use port 80 (standard HTTP):
```bash
# Stop docker-compose
docker-compose down

# Edit docker-compose.yml - change port mapping:
# ports:
#   - "80:3000"  # Map port 80 to container 3000

# Restart
docker-compose up -d
```

### Option 2: With Domain & Free SSL

**Setup Steps:**

#### 1. Point Domain to VPS

Add these DNS records at your domain provider:
```
Type: A Record
Name: @
Value: YOUR_VPS_IP

Type: A Record  
Name: www
Value: YOUR_VPS_IP
```

#### 2. Install Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 3. Get SSL Certificate

```bash
# Stop containers temporarily
docker-compose down

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificates will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 4. Copy Certificates to Project

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Set permissions
sudo chmod 644 nginx/ssl/*.pem
```

#### 5. Update nginx.conf

Edit `nginx/nginx.conf` and replace `your-domain.com` with your actual domain.

#### 6. Start with Nginx

```bash
docker-compose up -d
```

Now access your site:
- **HTTP**: `http://your-domain.com` (redirects to HTTPS)
- **HTTPS**: `https://your-domain.com` ✅

#### 7. Auto-Renew SSL (Optional)

Certificates expire in 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line:
0 0 1 * * certbot renew --quiet && docker-compose restart nginx
```

---

## Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Or without downtime:
docker-compose build app
docker-compose up -d --no-deps app
```

### Stop Services
```bash
docker-compose down
```

### Backup Data
```bash
# Backup CSV data
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/

# Download to local machine (from your PC):
scp root@your-vps-ip:/path/to/backup-*.tar.gz ./
```

---

## Firewall Setup (Important!)

```bash
# Install UFW firewall
sudo apt install ufw -y

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If accessing directly on ports 3000/3001
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Monitoring

### Check Resource Usage
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Health Check
```bash
# Check if app is responding
curl http://localhost:3000

# Check backend
curl http://localhost:3001/api/health
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check if ports are in use
sudo netstat -tulpn | grep :3000

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory
```bash
# Check memory
free -h

# Restart containers
docker-compose restart

# Prune unused Docker resources
docker system prune -a
```

### Permission Issues with Data
```bash
# Fix ownership
sudo chown -R $USER:$USER backend/data/
```

---

## Cost Comparison

| VPS Option | RAM | Storage | Cost |
|------------|-----|---------|------|
| **DigitalOcean** | 1GB | 25GB | $6/month |
| **Vultr** | 1GB | 25GB | $6/month |
| **Linode** | 1GB | 25GB | $5/month |
| **Hetzner** | 2GB | 20GB | €4.5/month (~$5) |
| **Oracle Cloud** | 1GB | 47GB | **FREE** (always free tier) |

**Recommended:** Oracle Cloud Free Tier - completely free forever!

---

## Free VPS Option: Oracle Cloud

Oracle Cloud offers an always-free tier:
- ✅ 2x AMD VMs (1GB RAM each)
- ✅ 200GB total storage
- ✅ 10TB bandwidth/month
- ✅ Free forever (no credit card expiry)

**Sign up:** https://www.oracle.com/cloud/free/

---

## Next Steps

1. ✅ Deploy to VPS
2. ✅ Set up firewall
3. ✅ Configure domain (optional)
4. ✅ Set up SSL with Let's Encrypt
5. ✅ Configure auto-renewal
6. ✅ Set up automated backups

Your portfolio app is now running on your own VPS with full control! 🎉
