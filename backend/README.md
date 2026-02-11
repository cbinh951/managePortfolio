# Portfolio Management Backend

Backend API server for Personal Asset Management application.

## Tech Stack
- **Node.js** with Express
- **TypeScript** for type safety
- **CSV** file-based storage (Local or Google Drive)
- **Supabase** PostgreSQL database (optional)
- **Google Drive API** for cloud CSV storage
- **XIRR** calculation for investment returns

## Storage Options

This backend supports multiple storage configurations:

1. **Local CSV Files** (Default)
   - Files stored in `backend/data/` directory
   - No external dependencies required
   - Good for development and testing

2. **Google Drive CSV Files**
   - CSV files stored in Google Drive
   - Enables cloud storage with automatic versioning
   - Allows multi-environment data sharing
   - Requires Google Cloud service account

3. **Supabase PostgreSQL** (Optional)
   - Full-featured PostgreSQL database
   - Advanced querying and relationships
   - Automatic backups and scaling
   - Falls back to CSV if disabled

## Setup

### Basic Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Create `.env` file in backend directory
   - See "Environment Variables" section below

3. Run development server:
```bash
npm run dev
```

### Google Drive Setup (Optional)

To use Google Drive for CSV storage:

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Drive API

2. **Create Service Account:**
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Create a new service account
   - Download JSON key file
   - Save as `backend/credentials/google-service-account.json`

3. **Setup Google Drive Folder:**
   - Create a dedicated folder in Google Drive
   - Share the folder with service account email (give "Editor" access)
   - Copy the folder ID from the URL (e.g., `https://drive.google.com/drive/folders/FOLDER_ID`)

4. **Configure Environment:**
   ```bash
   GOOGLE_DRIVE_ENABLED=true
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/google-service-account.json
   ```

5. **Migrate Existing Data:**
   ```bash
   npm run migrate:drive
   ```
   This uploads all CSV files from `backend/data/` to Google Drive.

6. **Verify Setup:**
   - Start the server: `npm run dev`
   - Check health endpoint: `http://localhost:3001/health/drive`

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# Supabase (Optional - for PostgreSQL database)
ENABLE_SUPABASE=false
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_key

# Google Drive Storage (Optional)
GOOGLE_DRIVE_ENABLED=false
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/google-service-account.json

# Google Drive Advanced Options
GOOGLE_DRIVE_CACHE_ENABLED=true
GOOGLE_DRIVE_CACHE_TTL=300000
GOOGLE_DRIVE_RETRY_ATTEMPTS=3
GOOGLE_DRIVE_RETRY_DELAY=1000

# Stock Price API (Optional)
STOCK_PRICE_TIMEOUT_MS=5000
STOCK_PRICE_RETRY_DELAY_MS=1000
```

## API Endpoints

### Portfolios
- `GET /api/portfolios` - Get all portfolios
- `GET /api/portfolios/:id` - Get portfolio by ID
- `GET /api/portfolios/:id/performance` - Get portfolio performance (NAV, profit, XIRR)
- `POST /api/portfolios` - Create new portfolio

### Cash Accounts
- `GET /api/cash-accounts` - Get all cash accounts
- `GET /api/cash-accounts/:id` - Get cash account by ID
- `GET /api/cash-accounts/:id/balance` - Get cash account balance
- `POST /api/cash-accounts` - Create new cash account

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/portfolio/:portfolioId` - Get transactions by portfolio
- `GET /api/transactions/cash/:cashAccountId` - Get transactions by cash account
- `POST /api/transactions` - Create new transaction

### Snapshots
- `GET /api/snapshots` - Get all snapshots
- `GET /api/snapshots/portfolio/:portfolioId` - Get snapshots by portfolio
- `POST /api/snapshots` - Create new snapshot

### Dashboard
- `GET /api/dashboard` - Get dashboard summary (net worth, allocations, all performances)

### Health & Status
- `GET /health` - General API health check (includes storage info)
- `GET /health/drive` - Google Drive connection status and file listing

## Available Scripts

```bash
# Development
npm run dev          # Start development server with hot-reload

# Production
npm run build        # Compile TypeScript to JavaScript
npm start           # Run compiled production server

# Migration
npm run migrate:drive  # Upload local CSV files to Google Drive

# Testing
npm test            # Run tests (if configured)
```

## Data Storage

### CSV Files

Data is stored in CSV format with the following files:

- `asset.csv` - Asset types (STOCK, FOREX, GOLD, CASH)
- `platforms.csv` - Trading platforms/banks
- `strategies.csv` - Investment strategies
- `portfolios.csv` - Portfolio records
- `cash_accounts.csv` - Cash account records
- `transactions.csv` - Transaction records
- `snapshots.csv` - NAV historical snapshots
- `stock_prices.csv` - Cached stock price data
- `tracking_lists.csv` - Stock watchlists
- `tracking_stocks.csv` - Individual tracked stocks

### Storage Locations

**Local Storage:**
- Files stored in: `backend/data/`
- Direct file system access
- Fast read/write operations

**Google Drive Storage:**
- Files stored in designated Google Drive folder
- Cloud-based with automatic versioning
- File caching for improved performance
- Retry logic for network resilience

**Supabase (Optional):**
- PostgreSQL database tables
- Automatic fallback to CSV if unavailable

## Features

- ✅ Multiple storage backend support (Local, Google Drive, Supabase)
- ✅ File-based CSV storage (no database required)
- ✅ Google Drive integration for cloud storage
- ✅ Automatic file caching and retry logic
- ✅ XIRR calculation for investment performance
- ✅ TypeScript for type safety
- ✅ RESTful API design
- ✅ Comprehensive health checks

## Troubleshooting

### Google Drive Issues

**"Failed to initialize Google Drive"**
- Check that service account key file exists
- Verify `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` is correct
- Ensure folder is shared with service account email

**"File not found in Google Drive"**
- Run migration script: `npm run migrate:drive`
- Check folder ID in `GOOGLE_DRIVE_FOLDER_ID`
- Verify files exist in Google Drive web interface

**"Permission denied"**
- Check that service account has "Editor" access to folder
- Re-share folder with service account email if needed

**Slow performance:**
- Enable caching: `GOOGLE_DRIVE_CACHE_ENABLED=true`
- Increase cache TTL: `GOOGLE_DRIVE_CACHE_TTL=600000` (10 minutes)

### General Issues

**Port already in use:**
- Change port in `.env`: `PORT=3002`
- Or kill existing process on port 3001

**CORS errors:**
- Update `CORS_ORIGIN` in `.env`
- Add your frontend URL to `allowedOrigins` in server.ts

## Security Notes

**⚠️ IMPORTANT: Never commit credentials!**

- Keep `credentials/` folder in `.gitignore`
- Never commit `.env` file
- Rotate service account keys regularly
- Use environment variables for sensitive data
- Limit service account permissions to specific folder only

## Deployment

### Deploying with Google Drive

**For Render (recommended):**

See detailed guide: **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**

Quick steps:
1. Upload service account JSON to your server
2. Set environment variable `GOOGLE_SERVICE_ACCOUNT_JSON` with JSON content
3. Run migration to ensure all files are on Drive
4. Deploy and verify

**Key: Never commit credentials to git!** Use environment variables instead.

### Environment Variables for Production

**Render/Cloud Platforms:**
```bash
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...entire JSON...}
NODE_ENV=production
PORT=3001
```

**Traditional VPS:**
```bash
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=<your-folder-id>
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/credentials.json
NODE_ENV=production
PORT=3001
```
