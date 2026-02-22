'use client';

import { useState, useEffect, useMemo } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Portfolio, CashAccount, Transaction, TransactionType, Snapshot, PortfolioPerformance, CashBalance, Asset, AssetType, GoldType } from '@/types/models';
import MetricCard from '@/components/portfolio/MetricCard';
import TabNavigation from '@/components/portfolio/TabNavigation';
import OverviewTab from '@/components/portfolio/OverviewTab';
import HoldingsTab from '@/components/portfolio/HoldingsTab';
import TransactionsTab from '@/components/portfolio/TransactionsTab';
import SnapshotsTab from '@/components/portfolio/SnapshotsTab';
import PerformanceTab from '@/components/portfolio/PerformanceTab';
import EditPortfolioModal from '@/components/portfolio/EditPortfolioModal';
import AddTransactionModal from '@/components/portfolio/AddTransactionModal';
import EditTransactionModal from '@/components/transaction/EditTransactionModal';
import EditStockTransactionModal from '@/components/portfolio/EditStockTransactionModal';
import DeleteTransactionModal from '@/components/transaction/DeleteTransactionModal';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatXIRR } from '@/utils/performanceUtils';
import { stockPriceService } from '@/services/stock-price-service';


interface PortfolioDetailData {
    type: 'portfolio' | 'cash';
    name: string;
    portfolio?: Portfolio;
    cashAccount?: CashAccount;
    performance?: PortfolioPerformance;
    cashBalance?: CashBalance;
    transactions: Transaction[];
    snapshots: Snapshot[];
    asset?: Asset;
}

export default function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { settings } = useSettings();

    const [data, setData] = useState<PortfolioDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
    const [isDeleteTransactionModalOpen, setIsDeleteTransactionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionFilter, setTransactionFilter] = useState('');

    // Derived state - specific calculations moved up to respect Hook rules
    const isPortfolio = data?.type === 'portfolio';

    // Determine if asset is Stock type (explicit or implied)
    const isStockAsset = useMemo(() => {

        if (!data?.asset) return false;

        const type = data.asset.asset_type;
        const name = data.asset.asset_name?.toLowerCase() || '';


        // Explicit type check
        if (type === AssetType.STOCK) return true;

        // Keyword check for stock-related terms
        if (name.includes('stock') || name.includes('cổ phiếu') || name.includes('fund') || name.includes('etf')) return true;

        // Only show for stock types - do not default to true for unknown types
        return false;
    }, [data?.asset]);

    const goldHoldings = useMemo(() => {
        if (!data || data.type !== 'portfolio' || data.asset?.asset_type !== AssetType.GOLD) return null;

        let branded = 0;
        let privateGold = 0;

        data.transactions.forEach(t => {
            if (!t.quantity_chi) return;
            const qty = Number(t.quantity_chi);
            const isAddition = t.type === 'BUY' || t.type === 'DEPOSIT';
            const isSubtraction = t.type === 'SELL' || t.type === 'WITHDRAW';

            if (t.gold_type === GoldType.BRANDED) {
                if (isAddition) branded += qty;
                if (isSubtraction) branded -= qty;
            } else if (t.gold_type === GoldType.PRIVATE) {
                if (isAddition) privateGold += qty;
                if (isSubtraction) privateGold -= qty;
            }
        });

        return { branded, privateGold };
    }, [data]);

    const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
    const [missingPrices, setMissingPrices] = useState<string[]>([]);

    useEffect(() => {
        loadPortfolioData();
    }, [id]);

    useEffect(() => {
        if (data?.type === 'cash') {
            setActiveTab('transactions');
        }
    }, [data?.type]);

    // Fetch cached stock prices when transactions change (no wait time!)
    useEffect(() => {
        if (data?.type === 'portfolio' && data.transactions.length > 0) {
            const tickers = Array.from(new Set(data.transactions.filter(t => t.ticker).map(t => t.ticker!)));

            console.log('Loading cached prices for tickers:', tickers);

            if (tickers.length > 0) {
                stockPriceService.fetchCachedPrices(tickers).then(result => {
                    console.log('Cached prices loaded:', result.prices);
                    if (result.missing.length > 0) {
                        console.warn('Missing prices for:', result.missing);
                    }
                    setCurrentPrices(result.prices);
                    setMissingPrices(result.missing);
                });
            }
        }
    }, [data?.transactions, data?.type]);

    // --- Metric Calculations ---
    const { stockValue, cashBalance, totalPortfolioValue, unrealizedProfit, unrealizedProfitPercent, totalStockCost } = useMemo(() => {
        if (!data) return { stockValue: 0, cashBalance: 0, totalPortfolioValue: 0, unrealizedProfit: 0, unrealizedProfitPercent: 0, totalStockCost: 0 };

        // 1. Calculate Cash Balance from Transactions
        // Sum all transaction amounts. Amounts are signed in the database:
        // DEPOSIT/SELL/DIVIDEND are positive.
        // BUY/WITHDRAW are negative.
        let cash = 0;
        data.transactions.forEach(t => {
            cash += Number(t.amount);
        });

        // 2. Calculate Stock Value (Market Value of Holdings)
        const holdingMap = new Map<string, number>();
        data.transactions.forEach(t => {
            if (t.ticker && t.quantity) {
                const qty = Number(t.quantity);
                const current = holdingMap.get(t.ticker) || 0;
                if (t.type === 'BUY') holdingMap.set(t.ticker, current + qty);
                else if (t.type === 'SELL') holdingMap.set(t.ticker, current - qty);
            }
        });

        let stockVal = 0;
        holdingMap.forEach((qty, ticker) => {
            if (qty > 0) {
                // If currentPrices is empty (initial load), stockVal is 0. 
                // But this hook triggers on [currentPrices] so it will update.
                const price = currentPrices[ticker] || 0;
                stockVal += qty * price;
            }
        });

        // 3. Unrealized P/L
        let activeCost = 0;
        const costMap = new Map<string, { qty: number, cost: number }>();

        // Sort by date for accurate average cost
        const sorted = [...data.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach(t => {
            if (!t.ticker) return;
            const ticker = t.ticker;
            if (!costMap.has(ticker)) costMap.set(ticker, { qty: 0, cost: 0 });
            const h = costMap.get(ticker)!;

            const qty = Number(t.quantity || 0);
            const amt = Math.abs(Number(t.amount)); // Cost basis uses gross amount

            if (t.type === 'BUY') {
                h.qty += qty;
                h.cost += amt;
            } else if (t.type === 'SELL') {
                if (h.qty > 0) {
                    const avg = h.cost / h.qty;
                    h.cost -= (qty * avg);
                    h.qty -= qty;
                }
            }
        });

        costMap.forEach((h) => {
            if (h.qty > 0) activeCost += h.cost;
        });

        const unrealizedP = stockVal - activeCost;
        const unrealizedPP = activeCost > 0 ? (unrealizedP / activeCost) * 100 : 0;

        const totalVal = stockVal + cash;

        return {
            stockValue: stockVal,
            cashBalance: cash,
            totalPortfolioValue: totalVal,
            unrealizedProfit: unrealizedP,
            unrealizedProfitPercent: unrealizedPP,
            totalStockCost: activeCost
        };
    }, [data, currentPrices]);

    const loadPortfolioData = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            setError(null);

            // Check if ID starts with "CA" to determine if it's a cash account
            const isCashAccount = id.startsWith('CA');

            if (isCashAccount) {
                // Fetch as cash account directly
                const cashAccount = await apiClient.getCashAccount(id);
                const cashBalance = await apiClient.getCashAccountBalance(id);
                const transactions = await apiClient.getCashAccountTransactions(id);

                setData({
                    type: 'cash',
                    name: cashAccount.name,
                    cashAccount,
                    cashBalance,
                    transactions,
                    snapshots: [],
                });
            } else {
                // Fetch as portfolio
                // We use Promise.all for parallel fetching
                const [portfolio, performance, transactions, snapshots, assets] = await Promise.all([
                    apiClient.getPortfolio(id),
                    apiClient.getPortfolioPerformance(id),
                    apiClient.getPortfolioTransactions(id),
                    apiClient.getPortfolioSnapshots(id),
                    apiClient.getAssets(),
                ]);

                const asset = assets.find(a => a.asset_id === portfolio.asset_id);

                setData({
                    type: 'portfolio',
                    name: portfolio.name,
                    portfolio,
                    performance,
                    transactions,
                    snapshots,
                    asset,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleDelete = async () => {
        const entityName = data?.type === 'cash' ? 'cash account' : 'portfolio';
        if (!confirm(`Are you sure you want to delete this ${entityName}? This action cannot be undone.`)) return;

        try {
            if (data?.type === 'portfolio') {
                await apiClient.deletePortfolio(id);
            } else if (data?.type === 'cash') {
                await apiClient.deleteCashAccount(id);
            }
            router.push(data?.type === 'cash' ? '/cash-accounts' : '/portfolios');
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete. Please try again.');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPortfolioData(true);
        setRefreshing(false);
    };

    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    const handleAddTransactionClick = () => {
        setIsAddTransactionModalOpen(true);
    };

    const handleEditSuccess = () => {
        loadPortfolioData(true);
        setIsEditModalOpen(false);
    };

    const handleTransactionSuccess = () => {
        loadPortfolioData(true);
        setIsAddTransactionModalOpen(false);
    };

    const handleEditTransactionClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsEditTransactionModalOpen(true);
    };

    const handleDeleteTransactionClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteTransactionModalOpen(true);
    };

    const handleEditTransactionSuccess = () => {
        loadPortfolioData(true);
        setIsEditTransactionModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleDeleteTransactionSuccess = () => {
        loadPortfolioData(true);
        setIsDeleteTransactionModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        await apiClient.deleteTransaction(id);
    };

    const handleViewTransactions = (ticker: string) => {
        setTransactionFilter(ticker);
        setActiveTab('transactions');
    };



    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h2>
                        <p className="text-slate-400 mb-6">{error || 'The requested portfolio could not be found.'}</p>
                        <button
                            onClick={() => router.push('/portfolios')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Back to Portfolios
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const currentBalance = isPortfolio ? data!.performance?.current_nav || 0 : data!.cashBalance?.balance || 0;
    const totalInvested = isPortfolio ? data!.performance?.total_invested || 0 : 0;
    const totalWithdrawn = isPortfolio ? data!.performance?.total_withdrawn || 0 : 0;
    const totalEquity = isPortfolio ? data!.performance?.total_equity || 0 : 0;
    const profit = isPortfolio ? data!.performance?.profit || 0 : 0;
    const profitPercentage = isPortfolio ? data!.performance?.profit_percentage || 0 : 0;
    const xirr = isPortfolio ? data!.performance?.xirr || null : null;

    // Determine if asset is Stock type (explicit or implied)


    const tabs = [
        { id: 'overview', label: 'Overview', hidden: !isPortfolio },
        { id: 'holdings', label: 'Holdings', hidden: !isPortfolio || !isStockAsset },
        { id: 'transactions', label: 'Transactions' },
        { id: 'snapshots', label: 'Snapshots', hidden: !isPortfolio },
        { id: 'performance', label: 'Performance', hidden: !isPortfolio },
    ];



    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm mb-6">
                    <button
                        onClick={() => router.push('/portfolios')}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        Portfolios
                    </button>
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-white font-medium">{data.name}</span>
                </nav>

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{data.name}</h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Last updated: Today {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg bg-slate-800/50 border border-slate-700 hover:border-red-500/30 hover:bg-red-500/10"
                            title="Delete Portfolio"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={handleEditClick}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Missing Prices Warning */}
                {missingPrices.length > 0 && data.asset?.asset_type === AssetType.STOCK && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-yellow-400 font-semibold mb-1">Prices Not Available</h3>
                                <p className="text-slate-300 text-sm mb-2">
                                    Some stock prices are not in cache: <span className="font-mono text-yellow-300">{missingPrices.join(', ')}</span>
                                </p>
                                <button
                                    onClick={() => router.push('/portfolios')}
                                    className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                                >
                                    Go to Portfolios page and click "Sync Prices" to update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Metrics (New Layout) */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8`}>
                    {isPortfolio ? (
                        <>
                            {/* Row 1 */}
                            <MetricCard
                                label="NET ASSET VALUE"
                                value={formatCurrency(totalPortfolioValue, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-white"
                                subtitle="Stocks + Cash"
                            />
                            <MetricCard
                                label="MARKET VALUE"
                                value={formatCurrency(stockValue, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-blue-400"
                            />
                            <MetricCard
                                label="TOTAL INVESTED"
                                value={formatCurrency(totalInvested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-amber-400"
                            />
                            <MetricCard
                                label="CASH BALANCE"
                                value={formatCurrency(cashBalance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-emerald-400"
                            />

                            {/* Row 2 */}
                            <MetricCard
                                label="COST BASIS"
                                value={formatCurrency(totalStockCost, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-slate-300"
                            />
                            <MetricCard
                                label="UNREALIZED P/L"
                                value={formatCurrency(unrealizedProfit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                change={unrealizedProfitPercent}
                                trend={unrealizedProfit >= 0 ? 'up' : 'down'}
                                valueColor={unrealizedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                            />
                        </>
                    ) : (
                        <>
                            {/* Cash Account View */}
                            <MetricCard
                                label="CURRENT BALANCE"
                                value={formatCurrency(currentBalance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-white"
                            />
                            <MetricCard
                                label="TOTAL WITHDRAWN"
                                value={formatCurrency(
                                    data.transactions
                                        .filter(t => t.type === 'WITHDRAW')
                                        .reduce((sum, t) => sum + Math.abs(parseFloat(String(t.amount))), 0),
                                    'VND',
                                    settings.displayCurrency,
                                    settings.exchangeRate
                                )}
                                valueColor="text-red-400"
                            />
                        </>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="mb-6">
                        <TabNavigation
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={(tab) => {
                                setActiveTab(tab);
                                if (tab !== 'transactions') setTransactionFilter('');
                            }}
                        />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-96">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            portfolioName={data.name}
                            snapshots={data.snapshots}
                            transactions={data.transactions}
                            currentNAV={currentBalance}
                            assetType={data.asset?.asset_type}
                        />
                    )}
                    {activeTab === 'holdings' && (
                        <HoldingsTab
                            transactions={data.transactions}
                            currentPrices={currentPrices}
                            onEditTransaction={handleEditTransactionClick}
                            onDeleteTransaction={handleDeleteTransactionClick}
                            onRefresh={() => loadPortfolioData(true)}
                            onViewTransactions={handleViewTransactions}
                        />
                    )}
                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            transactions={data.transactions}
                            entity={isPortfolio ? data.portfolio! : data.cashAccount!}
                            onEdit={handleEditTransactionClick}
                            onDelete={handleDeleteTransactionClick}
                            onAddTransaction={handleAddTransactionClick}
                            initialSearch={transactionFilter}
                        />
                    )}
                    {activeTab === 'snapshots' && isPortfolio && (
                        <SnapshotsTab
                            snapshots={data.snapshots}
                            portfolioId={id}
                            assetType={data.asset?.asset_type as AssetType}
                            onUpdate={loadPortfolioData}
                        />
                    )}
                    {activeTab === 'performance' && (
                        <PerformanceTab
                            portfolioId={id}
                            xirr={xirr}
                            totalReturn={profitPercentage}
                            snapshots={data.snapshots}
                            transactions={data.transactions}
                        />
                    )}
                </div>

                {/* Modals */}
                <EditPortfolioModal
                    isOpen={isEditModalOpen}
                    portfolio={
                        isPortfolio
                            ? (data.portfolio ?? null)
                            : ({
                                portfolio_id: id,
                                name: data.cashAccount?.name || '',
                                asset_id: data.cashAccount?.platform_id || '', // Using platform_id as fallback
                                platform_id: data.cashAccount?.platform_id || '',
                                strategy_id: '',
                                start_date: new Date().toISOString().split('T')[0],
                            } as Portfolio)
                    }
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                />

                <AddTransactionModal
                    isOpen={isAddTransactionModalOpen}
                    portfolioId={isPortfolio ? id : ''}
                    cashAccountId={!isPortfolio ? id : undefined}
                    onClose={() => setIsAddTransactionModalOpen(false)}
                    onSuccess={handleTransactionSuccess}
                />

                {(selectedTransaction?.ticker || selectedTransaction?.type === 'BUY' || selectedTransaction?.type === 'SELL') ? (
                    <EditStockTransactionModal
                        isOpen={isEditTransactionModalOpen}
                        transaction={selectedTransaction}
                        onClose={() => {
                            setIsEditTransactionModalOpen(false);
                            setSelectedTransaction(null);
                        }}
                        onSuccess={handleEditTransactionSuccess}
                    />
                ) : (
                    <EditTransactionModal
                        isOpen={isEditTransactionModalOpen}
                        transaction={selectedTransaction}
                        onClose={() => {
                            setIsEditTransactionModalOpen(false);
                            setSelectedTransaction(null);
                        }}
                        onSuccess={handleEditTransactionSuccess}
                    />
                )}

                <DeleteTransactionModal
                    isOpen={isDeleteTransactionModalOpen}
                    transaction={selectedTransaction}
                    onClose={() => {
                        setIsDeleteTransactionModalOpen(false);
                        setSelectedTransaction(null);
                    }}
                    onSuccess={handleDeleteTransactionSuccess}
                    onDelete={handleDeleteTransaction}
                />
            </div>
        </main>
    );
}
