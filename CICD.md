# GitHub Actions CI/CD Setup Guide

## Overview

This project uses GitHub Actions to automatically deploy to your VPS whenever you push changes to the `main` branch.

---

## Setup Instructions

### 1. Generate SSH Key for GitHub Actions

On your **VPS**, create a dedicated SSH key for GitHub Actions:

```bash
# Generate SSH key (no passphrase for automation)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions -N ""

# Add the public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Display the private key (you'll need this for GitHub)
cat ~/.ssh/github-actions
```

**Copy the entire private key** (including `-----BEGIN` and `-----END` lines).

---

### 2. Add GitHub Secrets

Go to your GitHub repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 3 secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VPS_HOST` | Your VPS IP address | `103.98.149.173` |
| `VPS_USERNAME` | SSH username | `root` (or your username) |
| `VPS_SSH_KEY` | Private SSH key | *Content from `cat ~/.ssh/github-actions`* |

**Important**: When pasting the SSH key, include the entire key including the header and footer lines.

---

### 3. Test the Workflow

#### Option A: Push to Main Branch

```bash
# Make any change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test CI/CD deployment"
git push origin main
```

#### Option B: Manual Trigger

1. Go to **Actions** tab in GitHub
2. Click **Deploy to VPS** workflow
3. Click **Run workflow** → **Run workflow**

---

### 4. Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Watch the deployment progress in real-time

**Expected output:**
```
🚀 Starting deployment...
📥 Pulling latest code from GitHub...
🛑 Stopping containers...
🗑️ Removing old images...
🔨 Building new images...
▶️ Starting containers...
✅ Checking container status...
🎉 Deployment complete!
```

---

## Workflow Features

### 🔄 Auto-Deployment
- ✅ Triggers on every push to `main` branch
- ✅ Can be manually triggered from GitHub UI

### 🔨 Build Process
- ✅ Pulls latest code from GitHub
- ✅ Rebuilds Docker images with `--no-cache`
- ✅ Ensures latest dependencies are installed

### ✅ Health Checks
- ✅ Verifies frontend is accessible
- ✅ Checks backend API health endpoint
- ✅ Shows container status

### 📊 Logging
- ✅ Detailed step-by-step output
- ✅ Shows last 50 lines of container logs
- ✅ Clear success/failure notifications

---

## Workflow File Location

```
.github/workflows/deploy.yml
```

---

## Customization

### Change Trigger Branch

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - production  # Change from 'main' to your branch
```

### Add Slack/Discord Notifications

Add this step to notify your team:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to VPS ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Skip Deployment for Specific Changes

Add this to skip deployment for README changes:

```yaml
on:
  push:
    branches:
      - main
    paths-ignore:
      - 'README.md'
      - 'docs/**'
      - '*.md'
```

---

## Troubleshooting

### ❌ "Permission denied (publickey)"

**Solution**: Check that `VPS_SSH_KEY` secret contains the full private key:

```bash
# On VPS, verify the key
cat ~/.ssh/github-actions
```

Copy the ENTIRE output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### ❌ "git pull failed"

**Solution**: Ensure the repository is cloned with HTTPS, not SSH:

```bash
# On VPS
cd ~/managePortfolio
git remote -v

# If it shows git@github.com, change to HTTPS:
git remote set-url origin https://github.com/cbinh951/managePortfolio.git
```

### ❌ "docker-compose: command not found"

**Solution**: Ensure docker-compose is installed:

```bash
# On VPS
which docker-compose

# If not found, install:
sudo apt install docker-compose -y
```

### ❌ Deployment succeeds but site doesn't update

**Solution**: Clear browser cache:

1. Open browser in **Incognito/Private mode**
2. Or clear cache: `Ctrl + Shift + Delete`
3. Force refresh: `Ctrl + F5`

---

## Security Best Practices

### 1. Use Dedicated SSH Key
✅ Already done - created `github-actions` key

### 2. Limit SSH Key Permissions
```bash
# On VPS
chmod 600 ~/.ssh/github-actions
chmod 700 ~/.ssh
```

### 3. Use Deploy Keys (Advanced)

Instead of SSH keys, use GitHub Deploy Keys:

1. Generate key: `ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""`
2. Add public key to GitHub: **Settings** → **Deploy keys**
3. Add private key to secrets as `VPS_SSH_KEY`

### 4. Restrict IP Access (Optional)

```bash
# Only allow GitHub Actions IPs
sudo ufw allow from 140.82.112.0/20 to any port 22
```

---

## Monitoring

### View Deployment History

```bash
# On VPS
cd ~/managePortfolio
git log --oneline -10
```

### Check Container Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Check Container Status

```bash
docker-compose ps
docker stats
```

---

## Rollback

If a deployment fails, rollback to previous version:

```bash
# On VPS
cd ~/managePortfolio

# View recent commits
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash>

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Test deployment with a small change
3. ✅ Monitor the workflow execution
4. ✅ Verify the site updates after deployment
5. ✅ (Optional) Add Slack/Discord notifications
6. ✅ (Optional) Set up staging environment

---

**Your deployment is now automated!** 🎉

Every time you push to `main`, GitHub Actions will:
1. Pull latest code to VPS
2. Rebuild Docker images
3. Restart containers
4. Verify deployment

No more manual SSH and deployment commands!
