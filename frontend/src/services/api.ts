import axios, { AxiosInstance } from 'axios';
import {
    Portfolio,
    CashAccount,
    Transaction,
    Snapshot,
    PortfolioPerformance,
    CashBalance,
    DashboardData,
    Asset,
    Platform,
    Strategy,
    AssetTypeMetrics,
    TimeRange,
    PerformanceChartData,
    TrackingList,
    TrackingStock,
    TrackingListWithDetails,
} from '@/types/models';
import {
    ApiResponse,
    CreatePortfolioRequest,
    CreateCashAccountRequest,
    CreateTransactionRequest,
    CreateSnapshotRequest,
    SyncStockPricesResponse,
} from '@/types/api';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: `${API_BASE_URL}/api`,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // Dashboard
    async getDashboard(): Promise<DashboardData> {
        const response = await this.client.get<ApiResponse<DashboardData>>('/dashboard');
        console.log("🚀 ~ ApiClient ~ getDashboard ~ response:", response)
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch dashboard data');
        }
        return response.data.data;
    }

    // Portfolios
    async getPortfolios(): Promise<Portfolio[]> {
        const response = await this.client.get<ApiResponse<Portfolio[]>>('/portfolios');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch portfolios');
        }
        return response.data.data;
    }

    async getPortfolio(id: string): Promise<Portfolio> {
        const response = await this.client.get<ApiResponse<Portfolio>>(`/portfolios/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch portfolio');
        }
        return response.data.data;
    }

    async getPortfolioPerformance(id: string): Promise<PortfolioPerformance> {
        const response = await this.client.get<ApiResponse<PortfolioPerformance>>(
            `/portfolios/${id}/performance`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch portfolio performance');
        }
        return response.data.data;
    }

    async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
        const response = await this.client.post<ApiResponse<Portfolio>>('/portfolios', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create portfolio');
        }
        return response.data.data;
    }

    async updatePortfolio(id: string, data: { name?: string; platform_id?: string; strategy_id?: string }): Promise<Portfolio> {
        const response = await this.client.put<ApiResponse<Portfolio>>(`/portfolios/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update portfolio');
        }
        return response.data.data;
    }

    async deletePortfolio(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/portfolios/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete portfolio');
        }
    }

    async getPortfolioChartData(
        portfolioId: string,
        timeRange: TimeRange = TimeRange.ALL
    ): Promise<PerformanceChartData> {
        const response = await this.client.get<ApiResponse<PerformanceChartData>>(
            `/portfolios/${portfolioId}/performance-chart`,
            { params: { timeRange } }
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch chart data');
        }
        return response.data.data;
    }

    // Cash Accounts
    async getCashAccounts(): Promise<CashAccount[]> {
        const response = await this.client.get<ApiResponse<CashAccount[]>>('/cash-accounts');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch cash accounts');
        }
        return response.data.data;
    }

    async getCashAccount(id: string): Promise<CashAccount> {
        const response = await this.client.get<ApiResponse<CashAccount>>(`/cash-accounts/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch cash account');
        }
        return response.data.data;
    }

    async getCashAccountBalance(id: string): Promise<CashBalance> {
        const response = await this.client.get<ApiResponse<CashBalance>>(
            `/cash-accounts/${id}/balance`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch cash balance');
        }
        return response.data.data;
    }

    async createCashAccount(data: CreateCashAccountRequest): Promise<CashAccount> {
        const response = await this.client.post<ApiResponse<CashAccount>>('/cash-accounts', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create cash account');
        }
        return response.data.data;
    }

    async updateCashAccount(id: string, data: { name?: string; platform_id?: string; currency?: string }): Promise<CashAccount> {
        const response = await this.client.put<ApiResponse<CashAccount>>(`/cash-accounts/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update cash account');
        }
        return response.data.data;
    }

    async deleteCashAccount(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/cash-accounts/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete cash account');
        }
    }

    // Transactions
    async getTransactions(): Promise<Transaction[]> {
        const response = await this.client.get<ApiResponse<Transaction[]>>('/transactions');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch transactions');
        }
        return response.data.data;
    }

    async getPortfolioTransactions(portfolioId: string): Promise<Transaction[]> {
        const response = await this.client.get<ApiResponse<Transaction[]>>(
            `/transactions/portfolio/${portfolioId}`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch transactions');
        }
        return response.data.data;
    }

    async getCashAccountTransactions(cashAccountId: string): Promise<Transaction[]> {
        const response = await this.client.get<ApiResponse<Transaction[]>>(
            `/transactions/cash/${cashAccountId}`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch transactions');
        }
        return response.data.data;
    }

    async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
        const response = await this.client.post<ApiResponse<Transaction>>('/transactions', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create transaction');
        }
        return response.data.data;
    }

    async updateTransaction(id: string, data: Partial<CreateTransactionRequest>): Promise<Transaction> {
        const response = await this.client.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update transaction');
        }
        return response.data.data;
    }

    async deleteTransaction(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/transactions/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete transaction');
        }
    }

    // Snapshots
    async getSnapshots(): Promise<Snapshot[]> {
        const response = await this.client.get<ApiResponse<Snapshot[]>>('/snapshots');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch snapshots');
        }
        return response.data.data;
    }

    async getPortfolioSnapshots(portfolioId: string): Promise<Snapshot[]> {
        const response = await this.client.get<ApiResponse<Snapshot[]>>(
            `/snapshots/portfolio/${portfolioId}`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch snapshots');
        }
        return response.data.data;
    }

    async createSnapshot(data: CreateSnapshotRequest): Promise<Snapshot> {
        const response = await this.client.post<ApiResponse<Snapshot>>('/snapshots', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create snapshot');
        }
        return response.data.data;
    }

    async updateSnapshot(id: string, data: {
        date?: string;
        nav?: number;
        branded_gold_price?: number;
        private_gold_price?: number;
    }): Promise<Snapshot> {
        const response = await this.client.put<ApiResponse<Snapshot>>(`/snapshots/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update snapshot');
        }
        return response.data.data;
    }

    async deleteSnapshot(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/snapshots/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete snapshot');
        }
    }

    // Stock Prices
    async syncStockPrices(): Promise<SyncStockPricesResponse> {
        const response = await this.client.post<ApiResponse<SyncStockPricesResponse>>('/stock-price/sync');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to sync stock prices');
        }
        return response.data.data;
    }


    // Master Data
    async getAssets(): Promise<Asset[]> {
        const response = await this.client.get<ApiResponse<Asset[]>>('/master/assets');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch assets');
        }
        return response.data.data;
    }

    async getPlatforms(): Promise<Platform[]> {
        const response = await this.client.get<ApiResponse<Platform[]>>('/master/platforms');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch platforms');
        }
        return response.data.data;
    }

    async getStrategies(): Promise<Strategy[]> {
        const response = await this.client.get<ApiResponse<Strategy[]>>('/master/strategies');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch strategies');
        }
        return response.data.data;
    }

    async createAsset(data: { asset_name: string; asset_type: string }): Promise<Asset> {
        const response = await this.client.post<ApiResponse<Asset>>('/master/assets', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create asset');
        }
        return response.data.data;
    }

    async updateAsset(id: string, data: { asset_name?: string; asset_type?: string }): Promise<Asset> {
        const response = await this.client.put<ApiResponse<Asset>>(`/master/assets/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update asset');
        }
        return response.data.data;
    }

    async deleteAsset(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/master/assets/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete asset');
        }
    }

    async createPlatform(data: { platform_name: string; asset_id: string }): Promise<Platform> {
        const response = await this.client.post<ApiResponse<Platform>>('/master/platforms', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create platform');
        }
        return response.data.data;
    }

    async updatePlatform(id: string, data: { platform_name?: string; asset_id?: string }): Promise<Platform> {
        const response = await this.client.put<ApiResponse<Platform>>(`/master/platforms/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update platform');
        }
        return response.data.data;
    }

    async deletePlatform(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<{ message: string }>>(`/master/platforms/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete platform');
        }
    }

    // Asset Analytics
    async getAssetTypeMetrics(assetType?: string): Promise<AssetTypeMetrics> {
        const params = assetType ? { asset_type: assetType } : { asset_type: 'ALL' };
        console.log('🔍 Fetching metrics for asset type:', params.asset_type);
        const response = await this.client.get<ApiResponse<AssetTypeMetrics>>('/asset-analytics', { params });
        console.log('📊 Received metrics:', response.data.data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch asset type metrics');
        }
        return response.data.data;
    }

    // Tracking Lists
    async getTrackingLists(): Promise<TrackingList[]> {
        const response = await this.client.get<ApiResponse<TrackingList[]>>('/tracking');
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch tracking lists');
        }
        return response.data.data;
    }

    async getTrackingList(id: string): Promise<TrackingListWithDetails> {
        const response = await this.client.get<ApiResponse<TrackingListWithDetails>>(`/tracking/${id}`);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to fetch tracking list');
        }
        return response.data.data;
    }

    async createTrackingList(data: { name: string }): Promise<TrackingList> {
        const response = await this.client.post<ApiResponse<TrackingList>>('/tracking', data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to create tracking list');
        }
        return response.data.data;
    }

    async updateTrackingList(id: string, data: { name: string }): Promise<TrackingList> {
        const response = await this.client.put<ApiResponse<TrackingList>>(`/tracking/${id}`, data);
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update tracking list');
        }
        return response.data.data;
    }

    async deleteTrackingList(id: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<void>>(`/tracking/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete tracking list');
        }
    }

    // DISABLED: Upload Excel is preferred for better accuracy
    /*
    async uploadTrackingImage(id: string, imageFile: File): Promise<{ image_url: string; message?: string }> {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await this.client.post<ApiResponse<{ image_url: string; message?: string }>>(
            `/tracking/${id}/upload-image`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to upload image');
        }
        return response.data.data;
    }
    */

    async uploadTrackingExcel(id: string, excelFile: File): Promise<{ stocks_created: number; message?: string }> {
        const formData = new FormData();
        formData.append('file', excelFile);

        const response = await this.client.post<ApiResponse<{ stocks_created: number; message?: string }>>(
            `/tracking/${id}/upload-excel`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to upload Excel file');
        }
        return response.data.data;
    }

    async addTrackingStocks(
        listId: string,
        stocks: Array<{
            ticker: string;
            company_name: string;
            meeting_date?: string;
            stop_buy_price: number;
            sell_target_price: number;
            target_profit_percent?: number;
            notes?: string;
        }>
    ): Promise<TrackingStock[]> {
        const response = await this.client.post<ApiResponse<TrackingStock[]>>(
            `/tracking/${listId}/stocks`,
            { stocks }
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to add stocks');
        }
        return response.data.data;
    }

    async updateTrackingStock(stockId: string, updates: Partial<TrackingStock>): Promise<TrackingStock> {
        const response = await this.client.put<ApiResponse<TrackingStock>>(
            `/tracking/stocks/${stockId}`,
            updates
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to update stock');
        }
        return response.data.data;
    }

    async deleteTrackingStock(stockId: string): Promise<void> {
        const response = await this.client.delete<ApiResponse<void>>(`/tracking/stocks/${stockId}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to delete stock');
        }
    }

    async syncTrackingPrices(listId: string): Promise<{ total_stocks: number; successful: number; failed: number; message: string }> {
        const response = await this.client.post<ApiResponse<{ total_stocks: number; successful: number; failed: number; message: string }>>(
            `/tracking/${listId}/sync-prices`
        );
        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Failed to sync prices');
        }
        return response.data.data;
    }
}

export const apiClient = new ApiClient();
 