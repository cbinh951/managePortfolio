// API Request and Response Types

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface CreatePortfolioRequest {
    name: string;
    asset_id: string;
    platform_id: string;
    strategy_id: string;
    start_date: string;
}

export interface CreateCashAccountRequest {
    name: string;
    platform_id: string;
    currency: string;
}

export interface CreateTransactionRequest {
    date: string;
    type: string;
    amount: number;
    portfolio_id?: string;
    cash_account_id?: string;
    description?: string;
    // Gold-specific fields
    gold_type?: any; // Using any for enum compatibility in request
    quantity_chi?: number;
    unit_price?: number;
}

export interface CreateSnapshotRequest {
    portfolio_id: string;
    date: string;
    nav: number;
    // Gold-specific fields
    branded_gold_price?: number;
    private_gold_price?: number;
}
