# Personal Asset Management System

A comprehensive web application for managing personal investments and cash flow, built with TypeScript, Next.js, and Node.js/Express.

## Overview

This application helps you track and manage:
- **Investment Portfolios** (Stocks, Forex, Gold)
- **Cash Accounts** (Bank accounts, wallets)
- **Transactions** (Deposits, withdrawals, transfers)
- **Performance Analytics** (NAV tracking, XIRR calculation, profit/loss)
- **Net Worth** (Total assets overview with allocation)

## Architecture

### Backend
- **Node.js + Express** with TypeScript
- **CSV-based storage** (no database required)
- **File locking** for safe concurrent access
- **Automated backups** before each write operation
- **XIRR calculation** for investment returns

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling

## Project Structure

```
manage-portfolio/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Express server setup
│   ├── data/               # CSV data storage
│   │   ├── master/         # Master data (assets, platforms, strategies)
│   │   ├── portfolios.csv
│   │   ├── cash_accounts.csv
│   │   ├── transactions.csv
│   │   ├── snapshots.csv
│   │   └── backups/        # Automated backups
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── frontend/               # Next.js React application
    ├── src/
    │   ├── app/           # Next.js pages (App Router)
    │   ├── components/    # React components
    │   ├── services/      # API client
    │   └── types/         # TypeScript type definitions
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Access Application

Open your browser and navigate to `http://localhost:3000`

## Features

### ✅ Completed
- Backend API with all CRUD endpoints
- CSV-based data storage with file locking
- TypeScript type safety across frontend and backend
- XIRR calculation for investment performance
- Automated backup system
- Frontend project structure with API client
- Dashboard layout with getting started guide

### 🔄 In Progress
- Portfolio management UI
- Cash account tracking UI
- Transaction logging UI
- Performance charts and analytics
- Form validation and error handling

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Get overview with net worth and allocations

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
- `GET /api/transactions/portfolio/:id` - Get transactions by portfolio
- `GET /api/transactions/cash/:id` - Get transactions by cash account
- `POST /api/transactions` - Create new transaction

### Snapshots
- `GET /api/snapshots` - Get all NAV snapshots
- `GET /api/snapshots/portfolio/:id` - Get snapshots by portfolio
- `POST /api/snapshots` - Create new snapshot

## Data Model

The application uses CSV files for data storage with the following structure:

- **Assets** - Asset types (Stock, Forex, Gold, Cash)
- **Platforms** - Trading platforms, banks, wallets
- **Strategies** - Investment strategies (Long term, Mid term, DCA, Holding)
- **Portfolios** - Investment portfolio tracking
- **Cash Accounts** - Cash balance tracking
- **Transactions** - All financial transactions
- **Snapshots** - NAV (Net Asset Value) historical data

## Development

### Backend Development
```bash
cd backend
npm run dev      # Development with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production build
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm start        # Run production build
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| Frontend Language | TypeScript |
| Frontend Styling | Tailwind CSS |
| Frontend Charts | Recharts |
| Frontend Forms | React Hook Form |
| Frontend Tables | TanStack Table |
| Backend Framework | Express |
| Backend Language | TypeScript (Node.js) |
| Backend Storage | CSV (csv-parser, csv-writer) |
| Backend Calculations | Custom XIRR implementation |
| API Communication | Axios |

## License

Proprietary - Personal Project

## Author

Created for personal asset management and portfolio tracking.
