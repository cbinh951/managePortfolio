'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { AssetTypeMetrics } from '@/types/models';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import KPICard from '@/components/common/KPICard';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';
import AssetTypeFilter from '@/components/portfolio/AssetTypeFilter';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatXIRR } from '@/utils/performanceUtils';

// Icons
const TrendUpIcon = () => (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const CashIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export interface PortfolioRow {
    id: string;
    name: string;
    idBadge: string;
    assetType: string;
    platform: string;
    strategy: string;
    balance: number;
    withdrawn: number;
    profit: number;
    profitPercentage: number;
    xirr: number | null;
}

interface PortfolioData {
    rows: PortfolioRow[];
    totalNetWorth: number;
    totalProfit: number;
    totalCash: number;
}

export default function PortfoliosPage() {
    const { settings } = useSettings();
    const [data, setData] = useState<PortfolioData>({
        rows: [],
        totalNetWorth: 0,
        totalProfit: 0,
        totalCash: 0,
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssetType, setSelectedAssetType] = useState('ALL');
    const [filteredMetrics, setFilteredMetrics] = useState<AssetTypeMetrics | null>(null);
    const [metricsLoading, setMetricsLoading] = useState(false);

    useEffect(() => {
        loadPortfoliosData();
        loadFilteredMetrics(selectedAssetType);
    }, []);

    const loadPortfoliosData = async () => {
        try {
            setLoading(true);
            const [dashboardData, portfolios, cashAccounts, assets, platforms, strategies] = await Promise.all([
                apiClient.getDashboard(),
                apiClient.getPortfolios(),
                apiClient.getCashAccounts(),
                apiClient.getAssets(),
                apiClient.getPlatforms(),
                apiClient.getStrategies(),
            ]);

            const rows: PortfolioRow[] = [];

            // Add investment portfolios
            for (const portfolio of portfolios) {
                const performance = dashboardData.portfolios.find(p => p.portfolio_id === portfolio.portfolio_id);
                const asset = assets.find(a => a.asset_id === portfolio.asset_id);
                const platform = platforms.find(p => p.platform_id === portfolio.platform_id);
                const strategy = strategies.find(s => s.strategy_id === portfolio.strategy_id);

                rows.push({
                    id: portfolio.portfolio_id,
                    name: portfolio.name,
                    idBadge: `#${portfolio.portfolio_id}`,
                    assetType: asset?.asset_name || 'UNKNOWN',
                    platform: platform?.platform_name || 'Unknown',
                    strategy: strategy?.strategy_name || 'Unknown',
                    balance: performance?.current_nav || 0,
                    withdrawn: performance?.total_withdrawn || 0,
                    profit: performance?.profit || 0,
                    profitPercentage: performance?.profit_percentage || 0,
                    xirr: performance?.xirr || null,
                });
            }

            // Add cash accounts
            for (const cashAccount of cashAccounts) {
                const balance = dashboardData.cash_accounts.find(c => c.cash_account_id === cashAccount.cash_account_id);
                const platform = platforms.find(p => p.platform_id === cashAccount.platform_id);

                rows.push({
                    id: cashAccount.cash_account_id,
                    name: cashAccount.name,
                    idBadge: `#${cashAccount.cash_account_id}`,
                    assetType: 'CASH',
                    platform: platform?.platform_name || 'Unknown',
                    strategy: 'Holding',
                    balance: balance?.balance || 0,
                    withdrawn: 0,
                    profit: 0,
                    profitPercentage: 0,
                    xirr: null,
                });
            }

            setData({
                rows,
                totalNetWorth: dashboardData.total_net_worth,
                totalProfit: dashboardData.portfolios.reduce((sum, p) => sum + p.profit, 0),
                totalCash: dashboardData.total_cash,
            });
        } catch (error) {
            console.error('Failed to fetch portfolio data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilteredMetrics = async (assetType: string) => {
        try {
            console.log('🎯 Loading metrics for:', assetType);
            setMetricsLoading(true);
            const metrics = await apiClient.getAssetTypeMetrics(assetType);
            console.log('✅ Metrics loaded:', metrics);
            setFilteredMetrics(metrics);
        } catch (error) {
            console.error('Failed to load filtered metrics:', error);
        } finally {
            setMetricsLoading(false);
        }
    };

    const handleAssetTypeChange = (assetType: string) => {
        console.log('🔄 Filter changed to:', assetType);
        setSelectedAssetType(assetType);
        loadFilteredMetrics(assetType);
    };

    const handleCreateSuccess = () => {
        loadPortfoliosData();
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Portfolios</h1>
                        <p className="text-slate-400">
                            Manage your assets, track performance, and analyze growth.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Portfolio
                    </button>
                </div>

                {/* Asset Type Filter */}
                <div className="mb-6">
                    <AssetTypeFilter
                        selectedAssetType={selectedAssetType}
                        onFilterChange={handleAssetTypeChange}
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {metricsLoading ? (
                        // Loading skeleton
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                                    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                                    <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                                </div>
                            ))}
                        </>
                    ) : filteredMetrics ? (
                        // Filtered metrics with breakdown
                        <>
                            {/* Total Equity Card with Breakdown */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Total Equity
                                    </span>
                                    <div className="bg-blue-500/10 p-2 rounded-lg opacity-70">
                                        <TrendUpIcon />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-blue-400 mb-3">
                                    {formatCurrency(filteredMetrics.total_net_worth, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                </div>
                                {/* Breakdown */}
                                <div className="border-t border-slate-700 pt-3 space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Current NAV:</span>
                                        <span className="text-slate-300 font-medium">
                                            {formatCurrency(
                                                filteredMetrics.total_net_worth - filteredMetrics.total_withdrawn,
                                                'VND',
                                                settings.displayCurrency,
                                                settings.exchangeRate
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Withdrawn:</span>
                                        <span className="text-purple-400 font-medium">
                                            {formatCurrency(filteredMetrics.total_withdrawn, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs pt-1 border-t border-slate-700/50">
                                        <span className="text-slate-500">Invested:</span>
                                        <span className="text-slate-400 font-medium">
                                            {formatCurrency(filteredMetrics.total_invested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <KPICard
                                title="Total Profit/Loss"
                                value={formatCurrency(filteredMetrics.total_profit_loss, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                change={filteredMetrics.profit_loss_percentage}
                                changeLabel="Return"
                                icon={<TrendUpIcon />}
                                iconBg="bg-emerald-500/10"
                                valueColor={filteredMetrics.total_profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}
                            />
                            <KPICard
                                title="Cash"
                                value={formatCurrency(
                                    selectedAssetType === 'CASH' ? filteredMetrics.total_net_worth : data.totalCash,
                                    'VND',
                                    settings.displayCurrency,
                                    settings.exchangeRate
                                )}
                                icon={<CashIcon />}
                                iconBg="bg-green-500/10"
                                valueColor="text-green-400"
                            />
                        </>
                    ) : (
                        // Fallback to original data (shouldn't happen)
                        <>
                            <KPICard
                                title="Total Net Worth"
                                value={formatCurrency(data.totalNetWorth, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                icon={<TrendUpIcon />}
                                iconBg="bg-emerald-500/10"
                            />
                            <KPICard
                                title="Total Profit/Loss"
                                value={formatCurrency(data.totalProfit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                icon={<TrendUpIcon />}
                                iconBg="bg-emerald-500/10"
                                valueColor={data.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                            />
                            <KPICard
                                title="Cash"
                                value={formatCurrency(data.totalCash, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                icon={<CashIcon />}
                                iconBg="bg-green-500/10"
                                valueColor="text-green-400"
                            />
                        </>
                    )}
                </div>

                {/* Portfolio Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <PortfolioTable
                        data={
                            selectedAssetType === 'ALL'
                                ? data.rows
                                : data.rows.filter(row => row.assetType === selectedAssetType)
                        }
                    />
                )}
            </div>

            {/* Create Portfolio Modal */}
            <CreatePortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </main>
    );
}

