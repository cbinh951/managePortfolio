# 🚀 Render Deployment Quick Reference

## TL;DR - 3 Steps to Deploy

### 1️⃣ Get Your Credentials JSON
```bash
# Copy the entire content
cat backend/credentials/google-service-account.json
```

### 2️⃣ Set in Render Dashboard
Go to: **Your Service → Environment → Add Variable**

```
Key: GOOGLE_SERVICE_ACCOUNT_JSON
Value: {"type":"service_account","project_id":"...paste entire JSON here..."}
```

### 3️⃣ Set Other Required Variables
```
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
NODE_ENV=production
```

**Done!** ✅ Deploy and your app will use Google Drive.

---

## Essential Environment Variables

### Minimum Required:
```bash
NODE_ENV=production
PORT=3001
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1abc...xyz
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Recommended:
```bash
CORS_ORIGIN=https://your-frontend.onrender.com
GOOGLE_DRIVE_CACHE_ENABLED=true
RENDER_EXTERNAL_URL=https://your-backend.onrender.com
```

---

## How It Works

**Local Development:**
```
Uses file: backend/credentials/google-service-account.json
```

**Render Production:**
```
Uses env var: GOOGLE_SERVICE_ACCOUNT_JSON
```

**The code automatically detects which to use!**

---

## Security Checklist

- ✅ Credentials in `.gitignore`
- ✅ Never commit `.env` file
- ✅ Use environment variables on Render
- ✅ Don't put secrets in `render.yaml`
- ✅ Rotate keys every 6 months

---

## Verification

After deploying, test these URLs:

```bash
# General health
https://your-service.onrender.com/health

# Google Drive status
https://your-service.onrender.com/health/drive
```

Expected: `"googleDrive": {"enabled": true, "initialized": true}`

---

## Troubleshooting

### "Service account key file not found"
➜ Missing `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable

### "Invalid JSON"
➜ Minify JSON (remove line breaks), ensure proper escaping

### "Permission denied"
➜ Share Google Drive folder with service account email

### Still stuck?
➜ Read full guide: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

## Pro Tips

💡 **Migrate before deploying:**
```bash
npm run migrate:drive  # Run locally first
```

💡 **Test env var locally:**
```bash
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account"...}'
npm run dev  # Should work without credentials file!
```

💡 **Minify JSON for environment variable:**
```bash
cat credentials.json | jq -c .
```

💡 **View Render logs in real-time:**
Dashboard → Logs tab → Look for "Google Drive" messages

---

**Need more details?** See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for complete guide.
