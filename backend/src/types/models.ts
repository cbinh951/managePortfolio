// Data Models for Portfolio Management System

export enum AssetType {
    STOCK = 'STOCK',
    FOREX = 'FOREX',
    GOLD = 'GOLD',
    CASH = 'CASH',
}

export enum PlatformType {
    BROKER = 'BROKER',
    BANK = 'BANK',
    WALLET = 'WALLET',
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    TRANSFER = 'TRANSFER',
    BUY = 'BUY',
    SELL = 'SELL',
    FEE = 'FEE',
}

export interface Asset {
    asset_id: string;
    asset_name: string;
    asset_type?: AssetType; // Optional since removed from DB
}

export interface Platform {
    platform_id: string;
    platform_name: string;
    platform_type?: PlatformType; // Optional since removed from DB
    asset_id: string;
}

export interface Strategy {
    strategy_id: string;
    strategy_name: string;
    description: string;
}

export interface Portfolio {
    portfolio_id: string;
    name: string;
    asset_id: string;
    platform_id: string;
    strategy_id: string;
    start_date: string;
}

export interface CashAccount {
    cash_account_id: string;
    name: string;
    platform_id: string;
    currency: string;
}

export interface Transaction {
    transaction_id: string;
    date: string;
    type: TransactionType;
    amount: number;
    portfolio_id?: string;
    cash_account_id?: string;
    description?: string;
}

export interface Snapshot {
    snapshot_id: string;
    portfolio_id: string;
    date: string;
    nav: number;
}

// Calculated types
export interface PortfolioPerformance {
    portfolio_id: string;
    total_invested: number;
    current_nav: number;
    profit: number;
    profit_percentage: number;
    xirr: number;
}

export interface CashBalance {
    cash_account_id: string;
    balance: number;
}

export interface DashboardData {
    total_net_worth: number;
    total_cash: number;
    total_investment_nav: number;
    cash_percentage: number;
    investment_percentage: number;
    portfolios: PortfolioPerformance[];
    cash_accounts: CashBalance[];
}

export interface AssetTypeMetrics {
    asset_type: string;
    total_net_worth: number;
    total_profit_loss: number;
    profit_loss_percentage: number;
    average_xirr: number;
}
