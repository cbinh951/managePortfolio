// Data Models for Portfolio Management System

export enum AssetType {
    STOCK = 'STOCK',
    FOREX = 'FOREX',
    GOLD = 'GOLD',
    CASH = 'CASH',
}

export enum GoldType {
    BRANDED = 'BRANDED',  // Vàng thương hiệu (SJC, PNJ, DOJI)
    PRIVATE = 'PRIVATE',  // Vàng tư nhân (private gold)
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
    fee?: number; // Fee amount (absolute value)
    portfolio_id?: string;
    cash_account_id?: string;
    description?: string;
    // Gold-specific fields
    gold_type?: GoldType;
    quantity_chi?: number;  // Quantity in "chỉ" units (1 chỉ = 3.75g)
    unit_price?: number;    // Price per chỉ (optional, for reference)
    // Stock-specific fields
    ticker?: string;
    quantity?: number;
}

export interface Snapshot {
    snapshot_id: string;
    portfolio_id: string;
    date: string;
    nav: number;  // Keep for backward compatibility
    // Gold-specific fields
    branded_gold_price?: number;  // Price per chỉ for branded gold
    private_gold_price?: number;  // Price per chỉ for private gold
}

// Calculated types
export interface PortfolioPerformance {
    portfolio_id: string;
    total_invested: number;
    total_withdrawn: number;  // Sum of all withdrawals
    current_nav: number;
    total_equity: number;  // Current NAV + Total Withdrawn (core performance metric)
    profit: number;
    profit_percentage: number;
    xirr: number | null;  // null when XIRR calculation fails to converge
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
    total_net_worth: number;  // Total Equity across all portfolios
    total_withdrawn: number;  // Sum of all withdrawals
    total_invested: number;  // Sum of all deposits
    total_profit_loss: number;
    profit_loss_percentage: number;
    average_xirr: number;
}

// Portfolio Performance Chart Types
export enum TimeRange {
    ONE_MONTH = '1M',
    YEAR_TO_DATE = 'YTD',
    ONE_YEAR = '1Y',
    ALL = 'ALL',
}

export interface ChartDataPoint {
    date: string;  // ISO date string
    total_invested: number;
    total_withdrawn: number;
    current_nav: number;
    total_equity: number;  // Current NAV + Total Withdrawn
}

export interface TimelinePoint {
    date: string;
    transactions: Transaction[];
    snapshot: Snapshot | null;
}

export interface PerformanceChartData {
    portfolio_id: string;
    portfolio_name: string;
    data: ChartDataPoint[];
    summary: {
        total_invested: number;
        total_withdrawn: number;
        current_nav: number;
        total_equity: number;
        profit: number;
        profit_percentage: number;
        xirr: number | null;
    };
    hasData: boolean;
    message?: string;  // For edge cases like "No snapshots available"
}
