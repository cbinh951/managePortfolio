'use client';

import { useState, useEffect, useMemo } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Portfolio, CashAccount, Transaction, Snapshot, PortfolioPerformance, CashBalance, Asset, AssetType, GoldType } from '@/types/models';
import MetricCard from '@/components/portfolio/MetricCard';
import TabNavigation from '@/components/portfolio/TabNavigation';
import OverviewTab from '@/components/portfolio/OverviewTab';
import TransactionsTab from '@/components/portfolio/TransactionsTab';
import SnapshotsTab from '@/components/portfolio/SnapshotsTab';
import PerformanceTab from '@/components/portfolio/PerformanceTab';
import EditPortfolioModal from '@/components/portfolio/EditPortfolioModal';
import AddTransactionModal from '@/components/portfolio/AddTransactionModal';
import EditTransactionModal from '@/components/transaction/EditTransactionModal';
import DeleteTransactionModal from '@/components/transaction/DeleteTransactionModal';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatXIRR } from '@/utils/performanceUtils';


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

    // Derived state - specific calculations moved up to respect Hook rules
    const isPortfolio = data?.type === 'portfolio';

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

    useEffect(() => {
        loadPortfolioData();
    }, [id]);

    useEffect(() => {
        if (data?.type === 'cash') {
            setActiveTab('transactions');
        }
    }, [data?.type]);

    const loadPortfolioData = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
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
        await loadPortfolioData();
        setRefreshing(false);
    };

    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    const handleAddTransactionClick = () => {
        setIsAddTransactionModalOpen(true);
    };

    const handleEditSuccess = () => {
        loadPortfolioData();
        setIsEditModalOpen(false);
    };

    const handleTransactionSuccess = () => {
        loadPortfolioData();
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
        loadPortfolioData();
        setIsEditTransactionModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleDeleteTransactionSuccess = () => {
        loadPortfolioData();
        setIsDeleteTransactionModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        await apiClient.deleteTransaction(id);
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

    const tabs = [
        { id: 'overview', label: 'Overview', hidden: !isPortfolio },
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

                {/* Summary Metrics */}
                <div className={`grid grid-cols-1 ${isPortfolio ? (goldHoldings ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-3 lg:grid-cols-4') : 'md:grid-cols-3'} gap-6 mb-8`}>
                    {isPortfolio && (
                        <>
                            <MetricCard
                                label="TOTAL EQUITY"
                                value={formatCurrency(totalEquity, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-blue-400"
                                subtitle="NAV + Withdrawn"
                            />
                            <MetricCard
                                label="CURRENT NAV"
                                value={formatCurrency(currentBalance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-white"
                            />
                            <MetricCard
                                label="TOTAL INVESTED"
                                value={formatCurrency(totalInvested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-slate-300"
                            />
                            <MetricCard
                                label="TOTAL WITHDRAWN"
                                value={formatCurrency(totalWithdrawn, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-purple-400"
                            />
                            <MetricCard
                                label="TOTAL PROFIT"
                                value={formatCurrency(profit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                change={profitPercentage}
                                trend={profit >= 0 ? 'up' : 'down'}
                                valueColor={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                            />
                            {xirr !== null && (
                                <MetricCard
                                    label="XIRR"
                                    value={`${formatXIRR(xirr)}%`}
                                    trend={xirr >= 0 ? 'up' : 'down'}
                                    valueColor={xirr >= 0 ? 'text-emerald-400' : 'text-red-400'}
                                />
                            )}
                            {goldHoldings && (
                                <>
                                    <MetricCard
                                        label="BRANDED GOLD HOLDINGS"
                                        value={`${goldHoldings.branded.toLocaleString()} chỉ`}
                                        valueColor="text-yellow-500"
                                    />
                                    <MetricCard
                                        label="PRIVATE GOLD HOLDINGS"
                                        value={`${goldHoldings.privateGold.toLocaleString()} chỉ`}
                                        valueColor="text-yellow-600"
                                    />
                                </>
                            )}
                        </>
                    )}
                    {!isPortfolio && (
                        <>
                            <MetricCard
                                label="CURRENT BALANCE"
                                value={formatCurrency(currentBalance, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                valueColor="text-white"
                            />
                            <MetricCard
                                label="TOTAL WITHDRAW"
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
                            <MetricCard
                                label="TOTAL TRANSFER"
                                value={formatCurrency(
                                    data.transactions
                                        .filter(t => t.type === 'TRANSFER')
                                        .reduce((sum, t) => sum + Math.abs(parseFloat(String(t.amount))), 0) / 2, // Divide by 2 because each transfer has 2 records
                                    'VND',
                                    settings.displayCurrency,
                                    settings.exchangeRate
                                )}
                                valueColor="text-purple-400"
                            />
                        </>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
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
                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            transactions={data.transactions}
                            entity={isPortfolio ? data.portfolio! : data.cashAccount!}
                            onEdit={handleEditTransactionClick}
                            onDelete={handleDeleteTransactionClick}
                            onAddTransaction={handleAddTransactionClick}
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

                <EditTransactionModal
                    isOpen={isEditTransactionModalOpen}
                    transaction={selectedTransaction}
                    onClose={() => {
                        setIsEditTransactionModalOpen(false);
                        setSelectedTransaction(null);
                    }}
                    onSuccess={handleEditTransactionSuccess}
                />

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
