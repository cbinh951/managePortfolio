import { supabase, TABLES, isSupabaseEnabled } from '../config/supabase';
import {
    Portfolio,
    Transaction,
    Snapshot,
    CashAccount,
    Asset,
    Platform,
    Strategy,
    PortfolioPerformance,
    CashBalance,
    DashboardData,
    TransactionType,
    AssetTypeMetrics,
} from '../types/models';
import xirr from 'xirr';

export class SupabaseService {
    // ============================================
    // ASSETS (Master Data)
    // ============================================

    async getAllAssets(): Promise<Asset[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.ASSETS)
            .select('*')
            .order('asset_id');

        if (error) {
            console.error('Error fetching assets:', error);
            throw error;
        }
        return data || [];
    }

    async createAsset(asset: Omit<Asset, 'asset_id'>): Promise<Asset> {
        if (!supabase) throw new Error('Supabase not configured');

        const asset_id = `A${String(Date.now()).slice(-3)}`;

        const { data, error } = await supabase
            .from(TABLES.ASSETS)
            .insert({ ...asset, asset_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating asset:', error);
            throw error;
        }
        return data;
    }

    async updateAsset(asset_id: string, updates: Partial<Asset>): Promise<Asset | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.ASSETS)
            .update(updates)
            .eq('asset_id', asset_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating asset:', error);
            throw error;
        }
        return data;
    }

    async deleteAsset(asset_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from(TABLES.ASSETS)
            .delete()
            .eq('asset_id', asset_id);

        if (error) {
            console.error('Error deleting asset:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // PLATFORMS (Master Data)
    // ============================================

    async getAllPlatforms(): Promise<Platform[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.PLATFORMS)
            .select('*')
            .order('platform_id');

        if (error) {
            console.error('Error fetching platforms:', error);
            throw error;
        }
        return data || [];
    }

    async createPlatform(platform: Omit<Platform, 'platform_id'>): Promise<Platform> {
        if (!supabase) throw new Error('Supabase not configured');

        const platform_id = `P${String(Date.now()).slice(-3)}`;

        const { data, error } = await supabase
            .from(TABLES.PLATFORMS)
            .insert({ ...platform, platform_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating platform:', error);
            throw error;
        }
        return data;
    }

    async updatePlatform(platform_id: string, updates: Partial<Platform>): Promise<Platform | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.PLATFORMS)
            .update(updates)
            .eq('platform_id', platform_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating platform:', error);
            throw error;
        }
        return data;
    }

    async deletePlatform(platform_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from(TABLES.PLATFORMS)
            .delete()
            .eq('platform_id', platform_id);

        if (error) {
            console.error('Error deleting platform:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // STRATEGIES (Master Data)
    // ============================================

    async getAllStrategies(): Promise<Strategy[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.STRATEGIES)
            .select('*')
            .order('strategy_id');

        if (error) {
            console.error('Error fetching strategies:', error);
            throw error;
        }
        return data || [];
    }

    async createStrategy(strategy: Omit<Strategy, 'strategy_id'>): Promise<Strategy> {
        if (!supabase) throw new Error('Supabase not configured');

        const strategy_id = `S${String(Date.now()).slice(-3)}`;

        const { data, error } = await supabase
            .from(TABLES.STRATEGIES)
            .insert({ ...strategy, strategy_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating strategy:', error);
            throw error;
        }
        return data;
    }

    async updateStrategy(strategy_id: string, updates: Partial<Strategy>): Promise<Strategy | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.STRATEGIES)
            .update(updates)
            .eq('strategy_id', strategy_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating strategy:', error);
            throw error;
        }
        return data;
    }

    async deleteStrategy(strategy_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from(TABLES.STRATEGIES)
            .delete()
            .eq('strategy_id', strategy_id);

        if (error) {
            console.error('Error deleting strategy:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // PORTFOLIOS
    // ============================================

    async getAllPortfolios(): Promise<Portfolio[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.PORTFOLIOS)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching portfolios:', error);
            throw error;
        }
        return data || [];
    }

    async getPortfolioById(portfolio_id: string): Promise<Portfolio | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.PORTFOLIOS)
            .select('*')
            .eq('portfolio_id', portfolio_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching portfolio:', error);
            throw error;
        }
        return data;
    }

    async createPortfolio(portfolio: Omit<Portfolio, 'portfolio_id'>): Promise<Portfolio> {
        if (!supabase) throw new Error('Supabase not configured');

        const portfolio_id = `PF${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const { data, error } = await supabase
            .from(TABLES.PORTFOLIOS)
            .insert({ ...portfolio, portfolio_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating portfolio:', error);
            throw error;
        }
        return data;
    }

    async updatePortfolio(portfolio_id: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.PORTFOLIOS)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('portfolio_id', portfolio_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating portfolio:', error);
            throw error;
        }
        return data;
    }

    async deletePortfolio(portfolio_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        // Delete related data first
        await supabase.from(TABLES.TRANSACTIONS).delete().eq('portfolio_id', portfolio_id);
        await supabase.from(TABLES.SNAPSHOTS).delete().eq('portfolio_id', portfolio_id);

        const { error } = await supabase
            .from(TABLES.PORTFOLIOS)
            .delete()
            .eq('portfolio_id', portfolio_id);

        if (error) {
            console.error('Error deleting portfolio:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // CASH ACCOUNTS
    // ============================================

    async getAllCashAccounts(): Promise<CashAccount[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.CASH_ACCOUNTS)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cash accounts:', error);
            throw error;
        }
        return data || [];
    }

    async getCashAccountById(cash_account_id: string): Promise<CashAccount | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.CASH_ACCOUNTS)
            .select('*')
            .eq('cash_account_id', cash_account_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching cash account:', error);
            throw error;
        }
        return data;
    }

    async createCashAccount(account: Omit<CashAccount, 'cash_account_id'>): Promise<CashAccount> {
        if (!supabase) throw new Error('Supabase not configured');

        const cash_account_id = `CA${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const { data, error } = await supabase
            .from(TABLES.CASH_ACCOUNTS)
            .insert({ ...account, cash_account_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating cash account:', error);
            throw error;
        }
        return data;
    }

    async updateCashAccount(cash_account_id: string, updates: Partial<CashAccount>): Promise<CashAccount | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.CASH_ACCOUNTS)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('cash_account_id', cash_account_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating cash account:', error);
            throw error;
        }
        return data;
    }

    async deleteCashAccount(cash_account_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        // Delete related transactions first
        await supabase.from(TABLES.TRANSACTIONS).delete().eq('cash_account_id', cash_account_id);

        const { error } = await supabase
            .from(TABLES.CASH_ACCOUNTS)
            .delete()
            .eq('cash_account_id', cash_account_id);

        if (error) {
            console.error('Error deleting cash account:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // TRANSACTIONS
    // ============================================

    async getAllTransactions(): Promise<Transaction[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return (data || []).map(t => ({
            ...t,
            amount: Number(t.amount),
            type: t.type as TransactionType,
        }));
    }

    async getTransactionsByPortfolio(portfolio_id: string): Promise<Transaction[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .select('*')
            .eq('portfolio_id', portfolio_id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return (data || []).map(t => ({
            ...t,
            amount: Number(t.amount),
            type: t.type as TransactionType,
        }));
    }

    async getTransactionsByCashAccount(cash_account_id: string): Promise<Transaction[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .select('*')
            .eq('cash_account_id', cash_account_id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return (data || []).map(t => ({
            ...t,
            amount: Number(t.amount),
            type: t.type as TransactionType,
        }));
    }

    async createTransaction(transaction: Omit<Transaction, 'transaction_id'>): Promise<Transaction> {
        if (!supabase) throw new Error('Supabase not configured');

        const transaction_id = `T${Date.now()}${Math.floor(Math.random() * 10000)}`;

        // Clean up empty strings to null for foreign key fields
        const cleanedTransaction = {
            ...transaction,
            transaction_id,
            portfolio_id: transaction.portfolio_id || null,
            cash_account_id: transaction.cash_account_id || null,
            description: transaction.description || null,
        };

        const { data, error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .insert(cleanedTransaction)
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }

        return {
            ...data,
            amount: Number(data.amount),
            type: data.type as TransactionType,
        };
    }

    async updateTransaction(transaction_id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .update(updates)
            .eq('transaction_id', transaction_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }

        return {
            ...data,
            amount: Number(data.amount),
            type: data.type as TransactionType,
        };
    }

    async deleteTransaction(transaction_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from(TABLES.TRANSACTIONS)
            .delete()
            .eq('transaction_id', transaction_id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // SNAPSHOTS
    // ============================================

    async getAllSnapshots(): Promise<Snapshot[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.SNAPSHOTS)
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching snapshots:', error);
            throw error;
        }

        return (data || []).map(s => ({
            ...s,
            nav: Number(s.nav),
        }));
    }

    async getSnapshotsByPortfolio(portfolio_id: string): Promise<Snapshot[]> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.SNAPSHOTS)
            .select('*')
            .eq('portfolio_id', portfolio_id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching snapshots:', error);
            throw error;
        }

        return (data || []).map(s => ({
            ...s,
            nav: Number(s.nav),
        }));
    }

    async createSnapshot(snapshot: Omit<Snapshot, 'snapshot_id'>): Promise<Snapshot> {
        if (!supabase) throw new Error('Supabase not configured');

        const snapshot_id = `SNP${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const { data, error } = await supabase
            .from(TABLES.SNAPSHOTS)
            .insert({ ...snapshot, snapshot_id })
            .select()
            .single();

        if (error) {
            console.error('Error creating snapshot:', error);
            throw error;
        }

        return {
            ...data,
            nav: Number(data.nav),
        };
    }

    async updateSnapshot(snapshot_id: string, updates: Partial<Snapshot>): Promise<Snapshot | null> {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from(TABLES.SNAPSHOTS)
            .update(updates)
            .eq('snapshot_id', snapshot_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating snapshot:', error);
            throw error;
        }

        return {
            ...data,
            nav: Number(data.nav),
        };
    }

    async deleteSnapshot(snapshot_id: string): Promise<boolean> {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from(TABLES.SNAPSHOTS)
            .delete()
            .eq('snapshot_id', snapshot_id);

        if (error) {
            console.error('Error deleting snapshot:', error);
            return false;
        }
        return true;
    }

    // ============================================
    // PERFORMANCE CALCULATIONS
    // ============================================

    async getPortfolioPerformance(portfolio_id: string): Promise<PortfolioPerformance | null> {
        const portfolio = await this.getPortfolioById(portfolio_id);
        if (!portfolio) return null;

        const transactions = await this.getTransactionsByPortfolio(portfolio_id);
        const snapshots = await this.getSnapshotsByPortfolio(portfolio_id);

        // Fetch asset information to check if this is a gold portfolio
        const asset = await this.getAllAssets().then(assets =>
            assets.find(a => a.asset_id === portfolio.asset_id)
        );
        const isGoldPortfolio = asset?.asset_name === 'Vang' || asset?.asset_type === 'GOLD';

        // Calculate total invested (deposits - withdrawals)
        const totalInvested = transactions.reduce((sum, t) => {
            if (t.type === TransactionType.DEPOSIT ||
                (t.type === TransactionType.TRANSFER && t.amount > 0)) {
                return sum + Math.abs(t.amount);
            }
            if (t.type === TransactionType.WITHDRAW ||
                (t.type === TransactionType.TRANSFER && t.amount < 0)) {
                return sum - Math.abs(t.amount);
            }
            return sum;
        }, 0);

        // Get latest snapshot
        const latestSnapshot = snapshots[0];
        let currentNav = 0;

        if (isGoldPortfolio && latestSnapshot) {
            // For gold portfolios, calculate NAV from holdings and prices
            // Calculate gold holdings from transactions
            let brandedHoldings = 0;
            let privateHoldings = 0;

            transactions.forEach(t => {
                if (!t.quantity_chi) return;
                const qty = Number(t.quantity_chi);
                const isAddition = t.type === TransactionType.BUY || t.type === TransactionType.DEPOSIT;
                const isSubtraction = t.type === TransactionType.SELL || t.type === TransactionType.WITHDRAW;

                if (t.gold_type === 'BRANDED') {
                    if (isAddition) brandedHoldings += qty;
                    if (isSubtraction) brandedHoldings -= qty;
                } else if (t.gold_type === 'PRIVATE') {
                    if (isAddition) privateHoldings += qty;
                    if (isSubtraction) privateHoldings -= qty;
                }
            });

            // Calculate NAV from holdings and latest prices
            const brandedPrice = latestSnapshot.branded_gold_price || 0;
            const privatePrice = latestSnapshot.private_gold_price || 0;
            currentNav = (brandedHoldings * brandedPrice) + (privateHoldings * privatePrice);
        } else {
            // For non-gold portfolios, use NAV from snapshot
            currentNav = latestSnapshot ? latestSnapshot.nav : 0;
        }

        // Calculate profit
        const profit = currentNav - totalInvested;
        const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

        // Calculate XIRR
        let xirrValue = 0;
        try {
            const cashFlows = transactions
                .filter(t => t.type === TransactionType.DEPOSIT ||
                    t.type === TransactionType.WITHDRAW ||
                    t.type === TransactionType.TRANSFER)
                .map(t => ({
                    amount: t.type === TransactionType.WITHDRAW ? t.amount : -Math.abs(t.amount),
                    when: new Date(t.date),
                }));

            if (currentNav > 0 && cashFlows.length > 0) {
                cashFlows.push({
                    amount: currentNav,
                    when: new Date(),
                });
                xirrValue = xirr(cashFlows) * 100;
            }
        } catch (error) {
            console.error('Error calculating XIRR:', error);
        }

        return {
            portfolio_id,
            total_invested: totalInvested,
            current_nav: currentNav,
            profit,
            profit_percentage: profitPercentage,
            xirr: xirrValue,
        };
    }

    async getAllPortfolioPerformances(): Promise<PortfolioPerformance[]> {
        const portfolios = await this.getAllPortfolios();
        const performances: PortfolioPerformance[] = [];

        for (const portfolio of portfolios) {
            const perf = await this.getPortfolioPerformance(portfolio.portfolio_id);
            if (perf) {
                performances.push(perf);
            }
        }

        return performances;
    }

    async getCashBalance(cash_account_id: string): Promise<CashBalance> {
        const transactions = await this.getTransactionsByCashAccount(cash_account_id);

        const balance = transactions.reduce((sum, t) => {
            if (t.type === TransactionType.DEPOSIT ||
                (t.type === TransactionType.TRANSFER && t.amount > 0)) {
                return sum + Math.abs(t.amount);
            }
            if (t.type === TransactionType.WITHDRAW ||
                (t.type === TransactionType.TRANSFER && t.amount < 0)) {
                return sum - Math.abs(t.amount);
            }
            return sum;
        }, 0);

        return { cash_account_id, balance };
    }

    async getAllCashBalances(): Promise<CashBalance[]> {
        const accounts = await this.getAllCashAccounts();
        const balances: CashBalance[] = [];

        for (const account of accounts) {
            const balance = await this.getCashBalance(account.cash_account_id);
            balances.push(balance);
        }

        return balances;
    }

    // ============================================
    // DASHBOARD
    // ============================================

    async getDashboardData(): Promise<DashboardData> {
        const portfolios = await this.getAllPortfolioPerformances();
        const cashAccounts = await this.getAllCashBalances();

        const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalInvestmentNav = portfolios.reduce((sum, p) => sum + p.current_nav, 0);
        const totalNetWorth = totalCash + totalInvestmentNav;

        const cashPercentage = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 0;
        const investmentPercentage = totalNetWorth > 0 ? (totalInvestmentNav / totalNetWorth) * 100 : 0;

        return {
            total_net_worth: totalNetWorth,
            total_cash: totalCash,
            total_investment_nav: totalInvestmentNav,
            cash_percentage: cashPercentage,
            investment_percentage: investmentPercentage,
            portfolios,
            cash_accounts: cashAccounts,
        };
    }

    // ============================================
    // ASSET ANALYTICS
    // ============================================

    async getAssetTypeMetrics(assetTypeFilter?: string): Promise<AssetTypeMetrics> {
        // Get all portfolios, assets, and cash accounts
        const portfolios = await this.getAllPortfolios();
        const assets = await this.getAllAssets();
        const cashAccounts = await this.getAllCashAccounts();

        // Create a map of asset_id to asset_name for quick lookup
        const assetNameMap = new Map<string, string>();
        assets.forEach(asset => {
            assetNameMap.set(asset.asset_id, asset.asset_name);
        });

        // Initialize metrics
        let totalNetWorth = 0;
        let totalInvested = 0;
        const xirrs: number[] = [];

        // Handle CASH filter
        if (assetTypeFilter === 'CASH') {
            // Only include cash accounts
            for (const cashAccount of cashAccounts) {
                try {
                    const balanceData = await this.getCashBalance(cashAccount.cash_account_id);
                    if (balanceData) {
                        totalNetWorth += balanceData.balance;
                    }
                    // Cash accounts don't have invested amounts or XIRR
                } catch (error) {
                    console.error(`Error processing cash account ${cashAccount.cash_account_id}:`, error);
                }
            }
        } else {
            // Filter portfolios by asset name if specified
            let filteredPortfolios = portfolios;
            if (assetTypeFilter && assetTypeFilter !== 'ALL') {
                filteredPortfolios = portfolios.filter(p => {
                    const assetName = assetNameMap.get(p.asset_id);
                    return assetName === assetTypeFilter;
                });
            }

            // Calculate metrics for each portfolio
            for (const portfolio of filteredPortfolios) {
                try {
                    const performance = await this.getPortfolioPerformance(portfolio.portfolio_id);
                    if (performance) {
                        totalNetWorth += performance.current_nav;
                        totalInvested += performance.total_invested;
                        xirrs.push(performance.xirr);
                    }
                } catch (error) {
                    console.error(`Error getting performance for portfolio ${portfolio.portfolio_id}:`, error);
                }
            }

            // If ALL, also include cash accounts
            if (!assetTypeFilter || assetTypeFilter === 'ALL') {
                for (const cashAccount of cashAccounts) {
                    try {
                        const balanceData = await this.getCashBalance(cashAccount.cash_account_id);
                        if (balanceData) {
                            totalNetWorth += balanceData.balance;
                        }
                    } catch (error) {
                        console.error(`Error processing cash account ${cashAccount.cash_account_id}:`, error);
                    }
                }
            }
        }

        const totalProfitLoss = totalNetWorth - totalInvested;
        const profitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        // Calculate average XIRR
        const averageXirr = xirrs.length > 0
            ? xirrs.reduce((sum, val) => sum + val, 0) / xirrs.length
            : 0;

        return {
            asset_type: assetTypeFilter || 'ALL',
            total_net_worth: totalNetWorth,
            total_profit_loss: totalProfitLoss,
            profit_loss_percentage: Math.round(profitLossPercentage * 100) / 100,
            average_xirr: Math.round(averageXirr * 100) / 100,
        };
    }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
