# Portfolio Management Backend

Backend API server for Personal Asset Management application.

## Tech Stack
- **Node.js** with Express
- **TypeScript** for type safety
- **CSV** file-based storage
- **XIRR** calculation for investment returns

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Copy `.env` and adjust settings if needed
- Default port: 3001

3. Run development server:
```bash
npm run dev
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

## Data Storage

Data is stored in CSV files under `data/` directory:
- `master/assets.csv` - Asset types
- `master/platforms.csv` - Trading platforms/banks
- `master/strategies.csv` - Investment strategies
- `portfolios.csv` - Portfolio records
- `cash_accounts.csv` - Cash account records
- `transactions.csv` - Transaction records
- `snapshots.csv` - NAV snapshots
- `backups/` - Automated backups

## Features

- ✅ File-based CSV storage (no database required)
- ✅ Automatic backup before each write
- ✅ File locking for safe concurrent access
- ✅ XIRR calculation for investment performance
- ✅ TypeScript for type safety
- ✅ RESTful API design
