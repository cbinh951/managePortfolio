# Deploying to Render with Google Drive

This guide shows how to deploy your Portfolio Management backend to Render with Google Drive integration, **without committing credentials to git**.

## Overview

Render supports secure credential management through:
- ✅ **Environment Variables** - For sensitive configuration
- ✅ **Secret Files** - For credential files (not needed with our approach)
- ✅ **Environment Groups** - Reusable configs across services

We'll use **environment variables** to securely store Google service account credentials.

## Prerequisites

- Render account (free tier works)
- Google Cloud service account JSON file
- Google Drive folder ID
- Code pushed to GitHub/GitLab

## Deployment Steps

### 1. Prepare Your Repository

Ensure credentials are NOT committed:

```bash
# Verify .gitignore includes credentials
cat .gitignore | grep credentials
# Should show: backend/credentials/

# Check what would be committed
git status
# credentials/ should NOT appear

# Commit and push your code
git add .
git commit -m "Add Google Drive integration"
git push origin main
```

### 2. Create Web Service on Render

1. **Login to [Render Dashboard](https://dashboard.render.com/)**
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure the service:

   **Basic Settings:**
   ```
   Name: portfolio-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

   **Instance Type:**
   ```
   Free (or paid for better performance)
   ```

### 3. Configure Environment Variables

In Render dashboard, go to **Environment** tab and add these variables:

#### Required Variables:

```bash
# Server
NODE_ENV=production
PORT=3001

# Google Drive - ENABLE IT
GOOGLE_DRIVE_ENABLED=true

# Google Drive - Folder ID
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_from_google_drive

# Google Service Account - THE KEY PART!
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...PASTE_ENTIRE_JSON_HERE..."}
```

**Important for `GOOGLE_SERVICE_ACCOUNT_JSON`:**

1. Open your local credentials file:
   ```bash
   cat backend/credentials/google-service-account.json
   ```

2. Copy the **ENTIRE JSON content** (from `{` to `}`)

3. Paste it as the value for `GOOGLE_SERVICE_ACCOUNT_JSON` in Render

4. Make sure it's valid JSON (no line breaks, properly escaped)

#### Optional Variables:

```bash
# CORS (adjust for your frontend URL)
CORS_ORIGIN=https://your-frontend.onrender.com

# Supabase (if using)
ENABLE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_key

# Google Drive Performance Tuning
GOOGLE_DRIVE_CACHE_ENABLED=true
GOOGLE_DRIVE_CACHE_TTL=300000
GOOGLE_DRIVE_RETRY_ATTEMPTS=3
GOOGLE_DRIVE_RETRY_DELAY=1000

# Render Keep-Alive
RENDER_EXTERNAL_URL=https://your-service.onrender.com
```

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Pull your code
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm start`

3. **Watch the logs** for:
   ```
   📁 Google Drive storage is ENABLED
   ✅ Google Drive configuration validated
   📝 Using Google service account from environment variable
   ✅ Google Drive service initialized successfully
   🚀 Server running on port 3001
   ```

### 5. Upload Data to Google Drive

You have two options:

#### Option A: From Local (Before Deploy)
```bash
# Run migration script locally
cd backend
npm run migrate:drive

# This uploads all CSV files to Google Drive
# Then deploy - data is already there!
```

#### Option B: From Render (After Deploy)
```bash
# Use Render Shell
# 1. Go to Render Dashboard → Your Service → Shell tab
# 2. Run migration command:
npm run migrate:drive

# Or use Render API/CLI if available
```

**Recommended:** Option A (migrate before deploying)

### 6. Verify Deployment

1. **Check service URL:**
   ```
   https://your-service.onrender.com/health
   ```

2. **Expected response:**
   ```json
   {
     "status": "ok",
     "message": "Portfolio Management API is running",
     "storage": "csv",
     "googleDrive": {
       "enabled": true,
       "initialized": true
     }
   }
   ```

3. **Check Google Drive status:**
   ```
   https://your-service.onrender.com/health/drive
   ```

4. **Should show:**
   ```json
   {
     "enabled": true,
     "initialized": true,
     "connected": true,
     "stats": {
       "cacheSize": 0,
       "filesTracked": 10,
       "filesOnDrive": 10
     },
     "files": [...]
   }
   ```

## Environment Variable Details

### How to Get JSON Content

**Method 1: Command Line (Mac/Linux)**
```bash
cat backend/credentials/google-service-account.json | jq -c .
# Outputs minified JSON on one line
```

**Method 2: Command Line (Windows)**
```powershell
Get-Content backend/credentials/google-service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress
```

**Method 3: Manual**
1. Open the JSON file in text editor
2. Copy everything (including outer braces)
3. Remove ALL line breaks
4. Ensure proper escaping

**Example (minified):**
```json
{"type":"service_account","project_id":"portfolio-manager-12345","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"portfolio-backend@portfolio-manager-12345.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/portfolio-backend%40portfolio-manager-12345.iam.gserviceaccount.com"}
```

### Variable Priority

The code checks for credentials in this order:
1. **`GOOGLE_SERVICE_ACCOUNT_JSON`** (environment variable) - Used in production
2. **`GOOGLE_SERVICE_ACCOUNT_KEY_PATH`** (file path) - Used in development

**For Render:** Only set `GOOGLE_SERVICE_ACCOUNT_JSON`, not the file path.

## Render-Specific Configuration

### Build Configuration

Create `render.yaml` in your repository root (optional but recommended):

```yaml
services:
  - type: web
    name: portfolio-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: GOOGLE_DRIVE_ENABLED
        value: true
      - key: GOOGLE_DRIVE_FOLDER_ID
        sync: false  # Set manually in dashboard
      - key: GOOGLE_SERVICE_ACCOUNT_JSON
        sync: false  # Set manually in dashboard (NEVER in render.yaml!)
    healthCheckPath: /health
```

**⚠️ Important:** Never put `GOOGLE_SERVICE_ACCOUNT_JSON` value in `render.yaml` - it will be committed to git!

### Auto-Deploy Settings

**Enable Auto-Deploy:**
- Go to Settings → Auto-Deploy
- Toggle on "Auto-Deploy"
- Now every `git push` triggers a deploy

**Branch Configuration:**
- Most people use `main` branch
- Can setup staging with different branches

## Troubleshooting

### Issue: "Service account key file not found"

**Solution:** You're missing the environment variable.

```bash
# In Render Dashboard, verify:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account"...}
```

### Issue: "Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON"

**Causes:**
- Line breaks in JSON
- Missing quotes
- Invalid escape sequences

**Solution:**
1. Minify the JSON (remove all line breaks)
2. Ensure quotes are escaped
3. Use `jq -c .` to validate and compress

**Test locally first:**
```bash
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account"...}'
npm run dev
# Should work without the credentials file
```

### Issue: "The caller does not have permission"

**Solution:** Google Drive folder permissions.

1. Check folder is shared with service account email
2. Email is in the JSON: `client_email` field
3. Permission must be "Editor"
4. Wait a few minutes for propagation

### Issue: Slow performance on Render

**Solutions:**

1. **Enable caching:**
   ```bash
   GOOGLE_DRIVE_CACHE_ENABLED=true
   GOOGLE_DRIVE_CACHE_TTL=600000  # 10 minutes
   ```

2. **Upgrade Render instance** (free tier has limited CPU/memory)

3. **Check Google Drive API quotas** in Cloud Console

### Issue: Render keeps sleeping (free tier)

Render free tier sleeps after 15 minutes of inactivity.

**Solutions:**

1. **Use existing keep-alive** (already implemented in server.ts):
   ```bash
   RENDER_EXTERNAL_URL=https://your-service.onrender.com
   ```

2. **Or use external service:**
   - UptimeRobot (free)
   - Cron-job.org
   - Ping every 10 minutes

## Security Best Practices

### ✅ DO:
- Store credentials ONLY in Render environment variables
- Use environment variable `GOOGLE_SERVICE_ACCOUNT_JSON`
- Keep `.gitignore` updated
- Rotate service account keys every 6 months
- Use different service accounts for dev/staging/prod
- Limit service account to specific Google Drive folder

### ❌ DON'T:
- Commit credentials to git (even private repos)
- Put secrets in `render.yaml`
- Share environment variables publicly
- Use production credentials in development
- Give service account broader permissions than needed

## Migration Workflow

### Initial Setup:
```bash
# 1. Local development with file
cp service-account.json backend/credentials/
npm run dev

# 2. Migrate data to Google Drive
npm run migrate:drive

# 3. Push code (without credentials!)
git add .
git commit -m "Add Google Drive support"
git push

# 4. Deploy to Render with env var
# Set GOOGLE_SERVICE_ACCOUNT_JSON in dashboard

# 5. Verify
curl https://your-service.onrender.com/health/drive
```

### Updating Service Account:

If you need to rotate keys:

```bash
# 1. Generate new key in Google Cloud Console
# 2. Update Render environment variable
# 3. Redeploy (Render auto-restarts)
# 4. Verify connection
# 5. Delete old key from Google Cloud
```

## Monitoring

### Health Checks

Render can monitor your service:

1. **Set Health Check Path:** `/health`
2. **Expected Status Code:** 200
3. **Timeout:** 30 seconds

### Logs

View real-time logs in Render Dashboard:

```bash
# Look for these messages:
✅ Google Drive service initialized successfully
✅ Connected to Google Drive successfully
📁 Found 10 files in Google Drive folder

# Watch for errors:
❌ Failed to initialize Google Drive
❌ Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON
```

### Alerts

Set up alerts in Render:
- Service down
- High error rate
- Memory/CPU limits

## Cost Considerations

### Render Pricing:
- **Free Tier:** Limited hours, sleeps after 15 min
- **Starter ($7/mo):** Always on, better performance
- **Standard ($25/mo):** More resources

### Google Drive API:
- **Free Tier:** 1 billion requests/day
- Your usage: ~100-1000 requests/day
- **Cost:** FREE for this use case

## Alternative: Secret Files (Not Needed)

Render also supports **Secret Files**, but our environment variable approach is simpler:

<details>
<summary>Using Secret Files (Alternative Method)</summary>

1. **In Render Dashboard:**
   - Go to Environment → Secret Files
   - Click "Add Secret File"
   - Filename: `credentials/google-service-account.json`
   - Contents: Paste JSON

2. **Update code:**
   - No changes needed
   - Set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/google-service-account.json`

This creates a virtual file that only exists in the container.

</details>

## Complete Checklist

Before deploying to Render:

- [ ] Google Cloud project setup complete
- [ ] Service account created with Drive API enabled
- [ ] Google Drive folder created and shared
- [ ] Data migrated to Google Drive (`npm run migrate:drive`)
- [ ] Credentials NOT in git (check with `git status`)
- [ ] `.gitignore` includes `credentials/` and `.env`
- [ ] Code pushed to GitHub/GitLab
- [ ] Render service created
- [ ] All environment variables set (especially `GOOGLE_SERVICE_ACCOUNT_JSON`)
- [ ] Service deployed successfully
- [ ] `/health` endpoint returns OK
- [ ] `/health/drive` shows connected
- [ ] Test CRUD operations work
- [ ] Monitor logs for errors

## Summary

**Key Points:**
1. ✅ **NEVER commit** credentials to git
2. ✅ **USE** `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable on Render
3. ✅ **SET** in Render Dashboard → Environment tab
4. ✅ **PASTE** entire JSON content (minified, one line)
5. ✅ **MIGRATE** data before or after deployment
6. ✅ **TEST** with `/health/drive` endpoint

**Your credentials stay secure, and Render reads them from environment variables!** 🔒

---

Need help? Check:
- [Render Environment Variables Docs](https://render.com/docs/environment-variables)
- [Google Drive API Docs](https://developers.google.com/drive/api/guides/about-sdk)
- Your server logs in Render Dashboard
