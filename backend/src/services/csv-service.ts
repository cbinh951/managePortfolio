import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
    Asset,
    Platform,
    Strategy,
    Portfolio,
    CashAccount,
    Transaction,
    Snapshot,
    StockPrice,
    TrackingList,
    TrackingStock,
    TransactionType,
    AssetType,
    GoldType,
} from '../types/models';

const DATA_DIR = path.resolve(__dirname, '../../data');

const FILES = {
    ASSETS: 'asset.csv',
    PLATFORMS: 'platforms.csv',
    STRATEGIES: 'strategies.csv',
    PORTFOLIOS: 'portfolios.csv',
    CASH_ACCOUNTS: 'cash_accounts.csv',
    TRANSACTIONS: 'transactions.csv',
    SNAPSHOTS: 'snapshots.csv',
    STOCK_PRICES: 'stock_prices.csv',
    TRACKING_LISTS: 'tracking_lists.csv',
    TRACKING_STOCKS: 'tracking_stocks.csv',
};

export class CsvService {
    private getFilePath(filename: string): string {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        return path.join(DATA_DIR, filename);
    }

    private readCsv<T>(filename: string): T[] {
        const filePath = this.getFilePath(filename);
        if (!fs.existsSync(filePath)) {
            return [];
        }


        const fileContent = fs.readFileSync(filePath, 'utf8');
        const workbook = XLSX.read(fileContent, { type: 'string', raw: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Use raw: false to interpret values, but we might want raw strings for IDs
        const data = XLSX.utils.sheet_to_json<T>(worksheet, { raw: false });

        // Post-process to handle nulls and types
        return data.map(item => this.cleanItem(item));
    }

    private writeCsv<T>(filename: string, data: T[]): void {
        const filePath = this.getFilePath(filename);
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        fs.writeFileSync(filePath, csvOutput, 'utf8');
    }

    private cleanItem(item: any): any {
        const cleaned: any = {};
        for (const key in item) {
            let value = item[key];
            if (value === 'null' || value === '') {
                cleaned[key] = null;
            } else if (!isNaN(Number(value)) && key !== 'portfolio_id' && key !== 'transaction_id' && key !== 'asset_id' && key !== 'platform_id' && key !== 'strategy_id' && key !== 'cash_account_id' && !key.endsWith('_id')) {
                // Attempt to convert to number if it looks like one, but exclude IDs
                // However, some IDs might be numeric strings, so be careful.
                // Generally, let's keep it simple: assume the generic reader returns strings mostly
                // But sheet_to_json with raw:false might help.
                // Let's rely on specific model mapping instead of generic cleaning if possible.
                // For now, just handle explicit 'null' string
                cleaned[key] = value;
            } else {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }

    // ============================================
    // ASSETS
    // ============================================
    getAllAssets(): Asset[] {
        const assets = this.readCsv<Asset>(FILES.ASSETS);
        return assets.map(a => ({
            ...a,
            asset_type: (a as any).asset_type === 'null' ? undefined : (a as any).asset_type
        }));
    }

    createAsset(asset: Omit<Asset, 'asset_id'>): Asset {
        const assets = this.getAllAssets();
        const asset_id = `A${String(Date.now()).slice(-3)}`;
        const newAsset = { ...asset, asset_id, created_at: new Date().toISOString() };
        assets.push(newAsset);
        this.writeCsv(FILES.ASSETS, assets);
        return newAsset;
    }

    updateAsset(asset_id: string, updates: Partial<Asset>): Asset | null {
        const assets = this.getAllAssets();
        const index = assets.findIndex(a => a.asset_id === asset_id);
        if (index === -1) return null;

        const updated = { ...assets[index], ...updates };
        assets[index] = updated;
        this.writeCsv(FILES.ASSETS, assets);
        return updated;
    }

    deleteAsset(asset_id: string): boolean {
        let assets = this.getAllAssets();
        const initialLength = assets.length;
        assets = assets.filter(a => a.asset_id !== asset_id);
        if (assets.length === initialLength) return false;
        this.writeCsv(FILES.ASSETS, assets);
        return true;
    }

    // ============================================
    // PLATFORMS
    // ============================================
    getAllPlatforms(): Platform[] {
        return this.readCsv<Platform>(FILES.PLATFORMS);
    }

    createPlatform(platform: Omit<Platform, 'platform_id'>): Platform {
        const platforms = this.getAllPlatforms();
        const platform_id = `P${String(Date.now()).slice(-3)}`;
        const newPlatform = { ...platform, platform_id };
        platforms.push(newPlatform);
        this.writeCsv(FILES.PLATFORMS, platforms);
        return newPlatform;
    }

    updatePlatform(platform_id: string, updates: Partial<Platform>): Platform | null {
        const platforms = this.getAllPlatforms();
        const index = platforms.findIndex(p => p.platform_id === platform_id);
        if (index === -1) return null;

        const updated = { ...platforms[index], ...updates };
        platforms[index] = updated;
        this.writeCsv(FILES.PLATFORMS, platforms);
        return updated;
    }

    deletePlatform(platform_id: string): boolean {
        let platforms = this.getAllPlatforms();
        const initialLength = platforms.length;
        platforms = platforms.filter(p => p.platform_id !== platform_id);
        if (platforms.length === initialLength) return false;
        this.writeCsv(FILES.PLATFORMS, platforms);
        return true;
    }

    // ============================================
    // PORTFOLIOS
    // ============================================
    getAllPortfolios(): Portfolio[] {
        const portfolios = this.readCsv<Portfolio>(FILES.PORTFOLIOS);
        // Sort by created_at desc
        return portfolios.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    getPortfolioById(portfolio_id: string): Portfolio | null {
        const portfolios = this.getAllPortfolios();
        return portfolios.find(p => p.portfolio_id === portfolio_id) || null;
    }

    createPortfolio(portfolio: Omit<Portfolio, 'portfolio_id'>): Portfolio {
        const portfolios = this.getAllPortfolios();
        const portfolio_id = `PF${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const newPortfolio = {
            ...portfolio,
            portfolio_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        portfolios.push(newPortfolio);
        this.writeCsv(FILES.PORTFOLIOS, portfolios);
        return newPortfolio;
    }

    updatePortfolio(portfolio_id: string, updates: Partial<Portfolio>): Portfolio | null {
        const portfolios = this.getAllPortfolios();
        const index = portfolios.findIndex(p => p.portfolio_id === portfolio_id);
        if (index === -1) return null;

        const updated = { ...portfolios[index], ...updates, updated_at: new Date().toISOString() };
        portfolios[index] = updated;
        this.writeCsv(FILES.PORTFOLIOS, portfolios);
        return updated;
    }

    deletePortfolio(portfolio_id: string): boolean {
        const portfolios = this.getAllPortfolios();
        const index = portfolios.findIndex(p => p.portfolio_id === portfolio_id);
        if (index === -1) return false;

        // Delete related
        this.deleteTransactionsByPortfolio(portfolio_id);
        this.deleteSnapshotsByPortfolio(portfolio_id);

        portfolios.splice(index, 1);
        this.writeCsv(FILES.PORTFOLIOS, portfolios);
        return true;
    }

    // ============================================
    // CASH ACCOUNTS
    // ============================================
    getAllCashAccounts(): CashAccount[] {
        const accounts = this.readCsv<CashAccount>(FILES.CASH_ACCOUNTS);
        return accounts.sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }

    getCashAccountById(id: string): CashAccount | null {
        return this.getAllCashAccounts().find(c => c.cash_account_id === id) || null;
    }

    createCashAccount(account: Omit<CashAccount, 'cash_account_id'>): CashAccount {
        const accounts = this.getAllCashAccounts();
        const cash_account_id = `CA${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const newAccount = { ...account, cash_account_id, created_at: new Date().toISOString() };
        accounts.push(newAccount);
        this.writeCsv(FILES.CASH_ACCOUNTS, accounts);
        return newAccount;
    }

    updateCashAccount(id: string, updates: Partial<CashAccount>): CashAccount | null {
        const accounts = this.getAllCashAccounts();
        const index = accounts.findIndex(c => c.cash_account_id === id);
        if (index === -1) return null;

        const updated = { ...accounts[index], ...updates, updated_at: new Date().toISOString() };
        accounts[index] = updated;
        this.writeCsv(FILES.CASH_ACCOUNTS, accounts);
        return updated;
    }

    deleteCashAccount(id: string): boolean {
        const accounts = this.getAllCashAccounts();
        const index = accounts.findIndex(c => c.cash_account_id === id);
        if (index === -1) return false;

        // Delete related
        this.deleteTransactionsByCashAccount(id);

        accounts.splice(index, 1);
        this.writeCsv(FILES.CASH_ACCOUNTS, accounts);
        return true;
    }

    // ============================================
    // TRANSACTIONS
    // ============================================
    getAllTransactions(): Transaction[] {
        const transactions = this.readCsv<any>(FILES.TRANSACTIONS);
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            type: t.type as TransactionType,
            quantity_chi: t.quantity_chi && t.quantity_chi !== 'null' ? Number(t.quantity_chi) : undefined,
            unit_price: t.unit_price && t.unit_price !== 'null' ? Number(t.unit_price) : undefined,
            fee: t.fee && t.fee !== 'null' ? Number(t.fee) : undefined,
            gold_type: t.gold_type && t.gold_type !== 'null' ? t.gold_type : undefined,
            ticker: t.ticker && t.ticker !== 'null' ? t.ticker : undefined,
            quantity: t.quantity && t.quantity !== 'null' ? Number(t.quantity) : undefined,
            portfolio_id: t.portfolio_id === 'null' ? undefined : t.portfolio_id,
            cash_account_id: t.cash_account_id === 'null' ? undefined : t.cash_account_id,
            description: t.description === 'null' ? undefined : t.description,
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    getTransactionsByPortfolio(portfolio_id: string): Transaction[] {
        return this.getAllTransactions().filter(t => t.portfolio_id === portfolio_id);
    }

    getTransactionsByCashAccount(cash_account_id: string): Transaction[] {
        return this.getAllTransactions().filter(t => t.cash_account_id === cash_account_id);
    }

    createTransaction(transaction: Omit<Transaction, 'transaction_id'>): Transaction {
        const transactions = this.getAllTransactions();
        const transaction_id = `T${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const newTransaction: any = {
            ...transaction,
            transaction_id,
            created_at: new Date().toISOString(),
            portfolio_id: transaction.portfolio_id || 'null',
            cash_account_id: transaction.cash_account_id || 'null',
            description: transaction.description || 'null',
            gold_type: transaction.gold_type || 'null',
            quantity_chi: transaction.quantity_chi || 'null',
            unit_price: transaction.unit_price || 'null',
            fee: transaction.fee || 'null',
            ticker: transaction.ticker || 'null',
            quantity: transaction.quantity || 'null',
        };

        transactions.unshift(newTransaction as Transaction); // Add to beginning for desc sort logic
        this.writeCsv(FILES.TRANSACTIONS, transactions);

        return {
            ...transaction,
            transaction_id,
            amount: Number(transaction.amount)
        };
    }

    updateTransaction(transaction_id: string, updates: Partial<Transaction>): Transaction | null {
        const allTransactions = this.readCsv<any>(FILES.TRANSACTIONS);
        const index = allTransactions.findIndex(t => t.transaction_id === transaction_id);
        if (index === -1) return null;

        const current = allTransactions[index];
        const updatedRaw = {
            ...current,
            ...updates,
            portfolio_id: updates.portfolio_id !== undefined ? (updates.portfolio_id || 'null') : current.portfolio_id,
            cash_account_id: updates.cash_account_id !== undefined ? (updates.cash_account_id || 'null') : current.cash_account_id,
            description: updates.description !== undefined ? (updates.description || 'null') : current.description,
            gold_type: updates.gold_type !== undefined ? (updates.gold_type || 'null') : current.gold_type,
            quantity_chi: updates.quantity_chi !== undefined ? (updates.quantity_chi || 'null') : current.quantity_chi,
            unit_price: updates.unit_price !== undefined ? (updates.unit_price || 'null') : current.unit_price,
            fee: updates.fee !== undefined ? (updates.fee || 'null') : current.fee,
            ticker: updates.ticker !== undefined ? (updates.ticker || 'null') : current.ticker,
            quantity: updates.quantity !== undefined ? (updates.quantity || 'null') : current.quantity,
        };

        allTransactions[index] = updatedRaw;
        this.writeCsv(FILES.TRANSACTIONS, allTransactions);

        return {
            ...updatedRaw,
            amount: Number(updatedRaw.amount),
            type: updatedRaw.type as TransactionType,
            quantity_chi: updatedRaw.quantity_chi && updatedRaw.quantity_chi !== 'null' ? Number(updatedRaw.quantity_chi) : undefined,
            unit_price: updatedRaw.unit_price && updatedRaw.unit_price !== 'null' ? Number(updatedRaw.unit_price) : undefined,
            fee: updatedRaw.fee && updatedRaw.fee !== 'null' ? Number(updatedRaw.fee) : undefined,
            gold_type: updatedRaw.gold_type && updatedRaw.gold_type !== 'null' ? updatedRaw.gold_type : undefined,
            ticker: updatedRaw.ticker && updatedRaw.ticker !== 'null' ? updatedRaw.ticker : undefined,
            quantity: updatedRaw.quantity && updatedRaw.quantity !== 'null' ? Number(updatedRaw.quantity) : undefined,
            portfolio_id: updatedRaw.portfolio_id === 'null' ? undefined : updatedRaw.portfolio_id,
            cash_account_id: updatedRaw.cash_account_id === 'null' ? undefined : updatedRaw.cash_account_id,
        };
    }

    deleteTransaction(transaction_id: string): boolean {
        let transactions = this.readCsv<any>(FILES.TRANSACTIONS);
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.transaction_id !== transaction_id);
        if (transactions.length === initialLength) return false;
        this.writeCsv(FILES.TRANSACTIONS, transactions);
        return true;
    }

    private deleteTransactionsByPortfolio(portfolio_id: string): void {
        let transactions = this.readCsv<any>(FILES.TRANSACTIONS);
        transactions = transactions.filter(t => t.portfolio_id !== portfolio_id);
        this.writeCsv(FILES.TRANSACTIONS, transactions);
    }

    private deleteTransactionsByCashAccount(cash_account_id: string): void {
        let transactions = this.readCsv<any>(FILES.TRANSACTIONS);
        transactions = transactions.filter(t => t.cash_account_id !== cash_account_id);
        this.writeCsv(FILES.TRANSACTIONS, transactions);
    }

    // ============================================
    // SNAPSHOTS
    // ============================================
    getAllSnapshots(): Snapshot[] {
        const snapshots = this.readCsv<any>(FILES.SNAPSHOTS);
        return snapshots.map(s => ({
            ...s,
            nav: Number(s.nav),
            branded_gold_price: s.branded_gold_price ? Number(s.branded_gold_price) : undefined,
            private_gold_price: s.private_gold_price ? Number(s.private_gold_price) : undefined,
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    getSnapshotsByPortfolio(portfolio_id: string): Snapshot[] {
        return this.getAllSnapshots().filter(s => s.portfolio_id === portfolio_id);
    }

    createSnapshot(snapshot: Omit<Snapshot, 'snapshot_id'>): Snapshot {
        const snapshots = this.readCsv<any>(FILES.SNAPSHOTS); // read raw to push
        const snapshot_id = `SNP${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const newSnapshot = { ...snapshot, snapshot_id };
        snapshots.push(newSnapshot);
        this.writeCsv(FILES.SNAPSHOTS, snapshots);

        return {
            ...newSnapshot,
            nav: Number(newSnapshot.nav)
        };
    }

    updateSnapshot(snapshot_id: string, updates: Partial<Snapshot>): Snapshot | null {
        const snapshots = this.readCsv<any>(FILES.SNAPSHOTS);
        const index = snapshots.findIndex(s => s.snapshot_id === snapshot_id);
        if (index === -1) return null;

        const updated = { ...snapshots[index], ...updates };
        snapshots[index] = updated;
        this.writeCsv(FILES.SNAPSHOTS, snapshots);

        return {
            ...updated,
            nav: Number(updated.nav),
            branded_gold_price: updated.branded_gold_price ? Number(updated.branded_gold_price) : undefined,
            private_gold_price: updated.private_gold_price ? Number(updated.private_gold_price) : undefined,
        };
    }

    deleteSnapshot(snapshot_id: string): boolean {
        let snapshots = this.readCsv<any>(FILES.SNAPSHOTS);
        const initialLength = snapshots.length;
        snapshots = snapshots.filter(s => s.snapshot_id !== snapshot_id);
        if (snapshots.length === initialLength) return false;
        this.writeCsv(FILES.SNAPSHOTS, snapshots);
        return true;
    }

    private deleteSnapshotsByPortfolio(portfolio_id: string): void {
        let snapshots = this.readCsv<any>(FILES.SNAPSHOTS);
        snapshots = snapshots.filter(s => s.portfolio_id !== portfolio_id);
        this.writeCsv(FILES.SNAPSHOTS, snapshots);
    }

    // ============================================
    // STRATEGIES
    // ============================================
    getAllStrategies(): Strategy[] {
        return this.readCsv<Strategy>(FILES.STRATEGIES);
    }

    createStrategy(strategy: Omit<Strategy, 'strategy_id'>): Strategy {
        const strategies = this.getAllStrategies();
        const strategy_id = `S${String(Date.now()).slice(-3)}`;
        const newStrategy = { ...strategy, strategy_id };
        strategies.push(newStrategy);
        this.writeCsv(FILES.STRATEGIES, strategies);
        return newStrategy;
    }

    updateStrategy(strategy_id: string, updates: Partial<Strategy>): Strategy | null {
        const strategies = this.getAllStrategies();
        const index = strategies.findIndex(s => s.strategy_id === strategy_id);
        if (index === -1) return null;

        const updated = { ...strategies[index], ...updates };
        strategies[index] = updated;
        this.writeCsv(FILES.STRATEGIES, strategies);
        return updated;
    }

    deleteStrategy(strategy_id: string): boolean {
        let strategies = this.getAllStrategies();
        const initialLength = strategies.length;
        strategies = strategies.filter(s => s.strategy_id !== strategy_id);
        if (strategies.length === initialLength) return false;
        this.writeCsv(FILES.STRATEGIES, strategies);
        return true;
    }

    // ============================================
    // STOCK PRICES CACHE
    // ============================================
    getAllStockPrices(): StockPrice[] {
        const prices = this.readCsv<StockPrice>(FILES.STOCK_PRICES);
        return prices.map(p => ({
            ticker: String(p.ticker).toUpperCase(),
            price: Number(p.price),
            updated_at: String(p.updated_at)
        }));
    }

    getStockPriceByTicker(ticker: string): StockPrice | null {
        const prices = this.getAllStockPrices();
        const upperTicker = ticker.toUpperCase();
        return prices.find(p => p.ticker === upperTicker) || null;
    }

    saveStockPrices(prices: StockPrice[]): void {
        // Read existing prices first
        const existingPrices = this.getAllStockPrices();
        const priceMap = new Map<string, StockPrice>();
        
        // Add existing prices to map
        existingPrices.forEach(p => {
            priceMap.set(p.ticker, p);
        });
        
        // Update/add new prices (this overwrites existing tickers with new data)
        prices.forEach(p => {
            priceMap.set(p.ticker.toUpperCase(), {
                ticker: p.ticker.toUpperCase(),
                price: p.price,
                updated_at: p.updated_at
            });
        });
        
        // Convert map back to array and write
        const mergedPrices = Array.from(priceMap.values());
        this.writeCsv(FILES.STOCK_PRICES, mergedPrices);
    }

    updateStockPrice(ticker: string, price: number): void {
        const prices = this.getAllStockPrices();
        const upperTicker = ticker.toUpperCase();
        const index = prices.findIndex(p => p.ticker === upperTicker);
        
        const updatedPrice: StockPrice = {
            ticker: upperTicker,
            price,
            updated_at: new Date().toISOString()
        };

        if (index !== -1) {
            prices[index] = updatedPrice;
        } else {
            prices.push(updatedPrice);
        }

        this.saveStockPrices(prices);
    }

    updateStockPrices(prices: Array<{ ticker: string; price: number; last_updated: string }>): void {
        // Convert to StockPrice format and save
        const stockPrices: StockPrice[] = prices.map(p => ({
            ticker: p.ticker.toUpperCase(),
            price: p.price,
            updated_at: p.last_updated
        }));
        this.saveStockPrices(stockPrices);
    }

    // ============================================
    // TRACKING LISTS
    // ============================================
    getAllTrackingLists(): TrackingList[] {
        const lists = this.readCsv<TrackingList>(FILES.TRACKING_LISTS);
        return lists.sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }

    getTrackingListById(list_id: string): TrackingList | null {
        const lists = this.getAllTrackingLists();
        return lists.find(l => l.list_id === list_id) || null;
    }

    createTrackingList(list: Omit<TrackingList, 'list_id' | 'created_at' | 'updated_at'>): TrackingList {
        const lists = this.getAllTrackingLists();
        const list_id = `TL${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const newList: TrackingList = {
            ...list,
            list_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        lists.push(newList);
        this.writeCsv(FILES.TRACKING_LISTS, lists);
        return newList;
    }

    updateTrackingList(list_id: string, updates: Partial<TrackingList>): TrackingList | null {
        const lists = this.getAllTrackingLists();
        const index = lists.findIndex(l => l.list_id === list_id);
        if (index === -1) return null;

        const updated = {
            ...lists[index],
            ...updates,
            updated_at: new Date().toISOString()
        };
        lists[index] = updated;
        this.writeCsv(FILES.TRACKING_LISTS, lists);
        return updated;
    }

    deleteTrackingList(list_id: string): boolean {
        const lists = this.getAllTrackingLists();
        const index = lists.findIndex(l => l.list_id === list_id);
        if (index === -1) return false;

        // Delete related stocks
        this.deleteTrackingStocksByList(list_id);

        lists.splice(index, 1);
        this.writeCsv(FILES.TRACKING_LISTS, lists);
        return true;
    }

    // ============================================
    // TRACKING STOCKS
    // ============================================
    getAllTrackingStocks(): TrackingStock[] {
        const stocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        return stocks.map(s => ({
            ...s,
            stop_buy_price: Number(s.stop_buy_price),
            sell_target_price: Number(s.sell_target_price),
            target_profit_percent: s.target_profit_percent ? Number(s.target_profit_percent) : undefined,
            row_order: Number(s.row_order || 0),
            meeting_date: s.meeting_date === 'null' ? undefined : s.meeting_date,
            continue_accumulation_date: s.continue_accumulation_date === 'null' ? undefined : s.continue_accumulation_date,
            notes: s.notes === 'null' ? undefined : s.notes,
        })).sort((a, b) => a.row_order - b.row_order);
    }

    getTrackingStocksByList(list_id: string): TrackingStock[] {
        return this.getAllTrackingStocks().filter(s => s.list_id === list_id);
    }

    getTrackingStockById(stock_id: string): TrackingStock | null {
        const stocks = this.getAllTrackingStocks();
        return stocks.find(s => s.stock_id === stock_id) || null;
    }

    createTrackingStock(stock: Omit<TrackingStock, 'stock_id'>): TrackingStock {
        const stocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        const stock_id = `TS${Date.now()}${Math.floor(Math.random() * 10000)}`;

        const newStock: any = {
            ...stock,
            stock_id,
            meeting_date: stock.meeting_date || 'null',
            target_profit_percent: stock.target_profit_percent || 'null',
            notes: stock.notes || 'null',
        };

        stocks.push(newStock);
        this.writeCsv(FILES.TRACKING_STOCKS, stocks);

        return {
            ...stock,
            stock_id,
        };
    }

    createTrackingStocksBatch(stocks: Omit<TrackingStock, 'stock_id'>[]): TrackingStock[] {
        const existingStocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        const newStocks: TrackingStock[] = [];

        stocks.forEach(stock => {
            const stock_id = `TS${Date.now()}${Math.floor(Math.random() * 10000)}`;
            const newStock: any = {
                ...stock,
                stock_id,
                meeting_date: stock.meeting_date || 'null',
                target_profit_percent: stock.target_profit_percent || 'null',
                notes: stock.notes || 'null',
            };
            existingStocks.push(newStock);
            newStocks.push({ ...stock, stock_id });
        });

        this.writeCsv(FILES.TRACKING_STOCKS, existingStocks);
        return newStocks;
    }

    updateTrackingStock(stock_id: string, updates: Partial<TrackingStock>): TrackingStock | null {
        const allStocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        const index = allStocks.findIndex(s => s.stock_id === stock_id);
        if (index === -1) return null;

        const current = allStocks[index];
        const updatedRaw = {
            ...current,
            ...updates,
            meeting_date: updates.meeting_date !== undefined ? (updates.meeting_date || 'null') : current.meeting_date,
            target_profit_percent: updates.target_profit_percent !== undefined ? (updates.target_profit_percent || 'null') : current.target_profit_percent,
            notes: updates.notes !== undefined ? (updates.notes || 'null') : current.notes,
        };

        allStocks[index] = updatedRaw;
        this.writeCsv(FILES.TRACKING_STOCKS, allStocks);

        return {
            ...updatedRaw,
            stop_buy_price: Number(updatedRaw.stop_buy_price),
            sell_target_price: Number(updatedRaw.sell_target_price),
            target_profit_percent: updatedRaw.target_profit_percent && updatedRaw.target_profit_percent !== 'null' ? Number(updatedRaw.target_profit_percent) : undefined,
            row_order: Number(updatedRaw.row_order || 0),
            meeting_date: updatedRaw.meeting_date === 'null' ? undefined : updatedRaw.meeting_date,
            notes: updatedRaw.notes === 'null' ? undefined : updatedRaw.notes,
        };
    }

    deleteTrackingStock(stock_id: string): boolean {
        let stocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        const initialLength = stocks.length;
        stocks = stocks.filter(s => s.stock_id !== stock_id);
        if (stocks.length === initialLength) return false;
        this.writeCsv(FILES.TRACKING_STOCKS, stocks);
        return true;
    }

    private deleteTrackingStocksByList(list_id: string): void {
        let stocks = this.readCsv<any>(FILES.TRACKING_STOCKS);
        stocks = stocks.filter(s => s.list_id !== list_id);
        this.writeCsv(FILES.TRACKING_STOCKS, stocks);
    }
}
