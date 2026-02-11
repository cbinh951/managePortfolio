# Google Drive Integration Setup Guide

This guide walks you through setting up Google Drive storage for your Portfolio Management application.

## Overview

Your backend now supports storing CSV files in Google Drive instead of local storage. This provides:
- ☁️ Cloud storage with automatic versioning
- 🔄 Multi-environment data sharing
- 💾 Built-in Google Drive backups
- 🌍 Access data from anywhere

## Prerequisites

- Google account
- Existing CSV data files (optional, for migration)
- Node.js and npm installed

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Portfolio Manager")
4. Click "Create"

### 2. Enable Google Drive API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and click "Enable"
4. Wait for activation (takes a few seconds)

### 3. Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Fill in details:
   - **Name**: `portfolio-backend-service`
   - **Description**: `Service account for Portfolio Management backend`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 4. Generate Service Account Key

1. Find your newly created service account in the list
2. Click on it to open details
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. **Save the downloaded JSON file securely!**

### 5. Setup Credentials in Backend

1. Create credentials folder in your backend:
   ```bash
   mkdir backend/credentials
   ```

2. Move the downloaded JSON file:
   ```bash
   # Rename it to google-service-account.json
   mv ~/Downloads/portfolio-manager-xxxxx.json backend/credentials/google-service-account.json
   ```

3. Verify the file exists:
   ```bash
   ls backend/credentials/
   # Should show: google-service-account.json
   ```

### 6. Create Google Drive Folder

1. Open [Google Drive](https://drive.google.com/)
2. Click "New" → "Folder"
3. Name it: `portfolio-csv-data`
4. Click "Create"
5. Open the folder
6. **Copy the Folder ID from URL:**
   - URL looks like: `https://drive.google.com/drive/folders/1abc...xyz`
   - Folder ID is the part after `/folders/`: `1abc...xyz`
   - Save this ID for later!

### 7. Share Folder with Service Account

1. Right-click the folder → "Share"
2. In the share dialog, paste the service account email:
   - Find it in the JSON file: look for `"client_email"` field
   - Example: `portfolio-backend-service@project-id.iam.gserviceaccount.com`
3. Set permission to **Editor**
4. Uncheck "Notify people"
5. Click "Share"

### 8. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` file and update these values:
   ```bash
   # Enable Google Drive
   GOOGLE_DRIVE_ENABLED=true
   
   # Paste your folder ID from step 6
   GOOGLE_DRIVE_FOLDER_ID=1abc...xyz
   
   # Confirm the path to your credentials file
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/google-service-account.json
   ```

3. Save the file

### 9. Migrate Existing Data (Optional)

If you have existing CSV files to upload:

1. Run the migration script:
   ```bash
   cd backend
   npm run migrate:drive
   ```

2. The script will:
   - ✅ Validate your configuration
   - ✅ Test Google Drive connection
   - ✅ List local CSV files
   - ✅ Upload each file to Google Drive
   - ✅ Provide detailed summary

3. Review the output:
   ```
   🚀 Starting migration to Google Drive...
   ✅ Connected to Google Drive successfully
   📁 Found 10 of 10 files locally
   📤 Starting file upload...
   ✅ Uploaded asset.csv (2.15 KB)
   ✅ Uploaded platforms.csv (1.08 KB)
   ...
   ✨ Migration completed!
   ```

### 10. Start the Server

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Look for these log messages:
   ```
   📁 Google Drive storage is ENABLED
   ✅ Google Drive configuration validated
   ✅ Google Drive service initialized successfully
   🚀 Server running on port 3001
   ```

### 11. Verify Setup

1. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

   Expected response:
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

2. Test Google Drive specific health check:
   ```bash
   curl http://localhost:3001/health/drive
   ```

   Expected response shows:
   - Connection status
   - List of files on Google Drive
   - Cache statistics

### 12. Test CRUD Operations

Test that data operations work with Google Drive:

1. **Create a test portfolio** (via your frontend or Postman)
2. **Check Google Drive** - the `portfolios.csv` file should be updated
3. **View file version history** in Google Drive (right-click file → "Version history")

## Verification Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] Service account created and key downloaded
- [ ] Credentials file in `backend/credentials/`
- [ ] Google Drive folder created
- [ ] Folder shared with service account email
- [ ] Environment variables configured
- [ ] Migration completed successfully (if applicable)
- [ ] Server starts without errors
- [ ] Health checks return positive status
- [ ] Can create/update/delete records
- [ ] Files update on Google Drive

## Configuration Options

### Cache Settings

Adjust these to optimize performance:

```bash
# Enable/disable caching (recommended: true)
GOOGLE_DRIVE_CACHE_ENABLED=true

# Cache time-to-live in milliseconds
# Default: 5 minutes (300000 ms)
# Increase for fewer API calls, decrease for fresher data
GOOGLE_DRIVE_CACHE_TTL=300000
```

### Retry Settings

Configure retry behavior for network issues:

```bash
# Number of retry attempts for failed operations
GOOGLE_DRIVE_RETRY_ATTEMPTS=3

# Delay between retries in milliseconds (exponential backoff)
GOOGLE_DRIVE_RETRY_DELAY=1000
```

## Troubleshooting

### Error: "Service account key file not found"

**Solution:**
1. Check file path: `ls backend/credentials/`
2. Verify `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` in `.env`
3. Ensure file is named exactly `google-service-account.json`

### Error: "The caller does not have permission"

**Solution:**
1. Verify folder is shared with service account
2. Check service account email in JSON file
3. Ensure permission is set to "Editor", not "Viewer"
4. Wait a few minutes for permissions to propagate

### Error: "File not found in Google Drive"

**Solution:**
1. Run migration: `npm run migrate:drive`
2. Check folder ID is correct in `.env`
3. Verify files exist in Google Drive web interface
4. Check you're looking at the correct folder

### Slow Performance

**Solution:**
1. Enable caching: `GOOGLE_DRIVE_CACHE_ENABLED=true`
2. Increase TTL: `GOOGLE_DRIVE_CACHE_TTL=600000`
3. Check your internet connection
4. Consider using local storage for development

### Files Not Updating

**Solution:**
1. Clear cache manually (restart server)
2. Reduce cache TTL for testing
3. Check server logs for errors
4. Verify write permissions on Drive folder

## Security Best Practices

### ✅ DO:
- Keep service account JSON file secure
- Add `credentials/` to `.gitignore`
- Use environment variables for sensitive data
- Limit service account access to specific folder only
- Rotate keys periodically (every 6-12 months)
- Use different service accounts for different environments

### ❌ DON'T:
- Commit credentials to git
- Share service account keys publicly
- Grant unnecessary permissions
- Use same credentials in multiple projects
- Store credentials in frontend code

## Switching Between Storage Modes

### To use Google Drive:
```bash
GOOGLE_DRIVE_ENABLED=true
```

### To use local files:
```bash
GOOGLE_DRIVE_ENABLED=false
```

No code changes needed! The application automatically switches.

## Backup Strategy

With Google Drive enabled:
- ✅ Automatic version history (30 days by default)
- ✅ Restore previous versions from Drive
- ✅ Download files manually anytime

Recommended: Keep local backups before major changes:
```bash
# Backup before updates
cp backend/data/*.csv backend/data/backups/
```

## Next Steps

After successful setup:
1. Test all CRUD operations
2. Monitor Google Drive API usage in Cloud Console
3. Set up monitoring/alerting for API errors
4. Document your setup for team members
5. Consider setting up separate folders for dev/staging/prod

## Support

If you encounter issues:
1. Check server logs for detailed errors
2. Review Google Cloud Console → API logs
3. Verify all configuration steps
4. Test with `/health/drive` endpoint

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Setup completed?** ✨ Your backend is now using Google Drive for cloud CSV storage!
