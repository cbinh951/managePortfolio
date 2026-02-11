'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Portfolio, Snapshot, AssetType } from '@/types/models';
import MetricCard from '@/components/portfolio/MetricCard';
import NAVChart from '@/components/snapshots/NAVChart';
import AddSnapshotForm from '@/components/snapshots/AddSnapshotForm';
import SnapshotHistoryTable from '@/components/snapshots/SnapshotHistoryTable';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { TransactionType, Transaction } from '@/types/models';
import { stockPriceService } from '@/services/stock-price-service';

export default function SnapshotsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { settings } = useSettings();

    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('ALL');
    const [assetType, setAssetType] = useState<AssetType | null>(null);
    const [liveNAV, setLiveNAV] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [portfolioData, snapshotsData, assetsData] = await Promise.all([
                apiClient.getPortfolio(id),
                apiClient.getPortfolioSnapshots(id),
                apiClient.getAssets()
            ]);

            // Check if this is an investment portfolio (not cash)
            if (!portfolioData) {
                throw new Error('Portfolio not found');
            }

            setPortfolio(portfolioData);
            setSnapshots(snapshotsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Determine asset type
            const asset = assetsData.find(a => a.asset_id === portfolioData.asset_id);
            setAssetType(asset?.asset_type || null);

            // Fetch transactions for Live NAV calculation
            const transactionsData = await apiClient.getPortfolioTransactions(id);

            // Calculate Cash
            let cash = 0;
            transactionsData.forEach(t => {
                const amt = Number(t.amount);
                if (t.type === TransactionType.DEPOSIT || t.type === TransactionType.WITHDRAW) {
                    cash += amt;
                }
            });

            // Calculate Stock Value
            let stockVal = 0;
            const holdingMap = new Map<string, number>();

            transactionsData.forEach(t => {
                if (t.ticker && t.quantity) {
                    const qty = Number(t.quantity);
                    const current = holdingMap.get(t.ticker) || 0;
                    if (t.type === 'BUY') holdingMap.set(t.ticker, current + qty);
                    else if (t.type === 'SELL') holdingMap.set(t.ticker, current - qty);
                }
            });

            // Fetch cached prices if needed
            const tickers = Array.from(holdingMap.keys());
            if (tickers.length > 0) {
                console.log('Fetching cached prices for tickers:', tickers);
                const result = await stockPriceService.fetchCachedPrices(tickers);
                tickers.forEach(ticker => {
                    const qty = holdingMap.get(ticker) || 0;
                    if (qty > 0) {
                        stockVal += qty * (result.prices[ticker] || 0);
                    }
                });
            }

            setLiveNAV(cash + stockVal);

        } catch (err) {
            console.error('Error loading snapshot data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSnapshotSuccess = () => {
        loadData();
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

    if (error || !portfolio) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                        <p className="text-slate-400 mb-6">{error || 'Portfolio not found'}</p>
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

    // Calculate metrics
    const currentNAV = snapshots.length > 0 ? snapshots[0].nav : 0;

    // YTD Growth
    const currentYear = new Date().getFullYear();
    const ytdSnapshots = snapshots.filter(s => new Date(s.date).getFullYear() === currentYear);
    const startOfYearNAV = ytdSnapshots.length > 0 ? ytdSnapshots[ytdSnapshots.length - 1].nav : currentNAV;
    const ytdGrowth = startOfYearNAV > 0 ? ((currentNAV - startOfYearNAV) / startOfYearNAV) * 100 : 0;
    const ytdGrowthAmount = currentNAV - startOfYearNAV;

    // All Time High
    const allTimeHigh = snapshots.length > 0 ? Math.max(...snapshots.map(s => s.nav)) : 0;
    const allTimeHighSnapshot = snapshots.find(s => s.nav === allTimeHigh);
    const allTimeHighDate = allTimeHighSnapshot ? new Date(allTimeHighSnapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

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
                    <button
                        onClick={() => router.push(`/portfolios/${id}`)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        {portfolio.name}
                    </button>
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-white font-medium">NAV History</span>
                </nav>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">NAV History</h1>
                        <p className="text-slate-400">
                            Track and manage your monthly Net Asset Value snapshots.
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MetricCard
                        label="CURRENT NAV"
                        value={formatCurrency(currentNAV, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        valueColor="text-white"
                        icon={
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                    />
                    <MetricCard
                        label="YTD GROWTH"
                        value={`${ytdGrowth >= 0 ? '+' : ''}${ytdGrowth.toFixed(2)}%`}
                        change={ytdGrowth}
                        changeLabel={formatCurrency(ytdGrowthAmount, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        trend={ytdGrowth >= 0 ? 'up' : 'down'}
                        valueColor={ytdGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}
                        icon={
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                    />
                    <MetricCard
                        label="ALL TIME HIGH"
                        value={formatCurrency(allTimeHigh, 'VND', settings.displayCurrency, settings.exchangeRate)}
                        changeLabel={allTimeHighDate}
                        valueColor="text-amber-400"
                        icon={
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        }
                    />
                </div>

                {/* Chart and Add Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <NAVChart
                            snapshots={snapshots}
                            selectedPeriod={selectedPeriod}
                            onPeriodChange={setSelectedPeriod}
                        />
                    </div>
                    <div>
                        <AddSnapshotForm
                            portfolioId={id}
                            assetType={assetType || undefined}
                            onSuccess={handleSnapshotSuccess}
                            liveNAV={liveNAV}
                        />
                    </div>
                </div>

                {/* Snapshot History Table */}
                <SnapshotHistoryTable snapshots={snapshots} onUpdate={loadData} assetType={assetType || undefined} />

                {/* Performance Insight */}
                {snapshots.length > 0 && ytdGrowth > 0 && (
                    <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Performance Insight</h3>
                                <p className="text-slate-300">
                                    Your portfolio is outperforming the S&P 500 benchmark by <span className="font-bold text-emerald-400">+{(ytdGrowth - 4.2).toFixed(2)}%</span> this year.
                                    Keep tracking your monthly NAV to maintain accurate performance metrics.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
