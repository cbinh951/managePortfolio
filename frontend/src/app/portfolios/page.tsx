'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import PortfolioTable from '@/components/portfolio/PortfolioTable';
import KPICard from '@/components/common/KPICard';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';

// Icons
const TrendUpIcon = () => (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const PercentIcon = () => (
    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
    profit: number;
    profitPercentage: number;
    xirr: number | null;
}

interface PortfolioData {
    rows: PortfolioRow[];
    totalNetWorth: number;
    totalProfit: number;
    averageXIRR: number;
}

export default function PortfoliosPage() {
    const [data, setData] = useState<PortfolioData>({
        rows: [],
        totalNetWorth: 0,
        totalProfit: 0,
        averageXIRR: 0,
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadPortfoliosData();
    }, []);

    const loadPortfoliosData = async () => {
        try {
            setLoading(true);
            const dashboardData = await apiClient.getDashboard();
            const portfolios = await apiClient.getPortfolios();
            const cashAccounts = await apiClient.getCashAccounts();

            const rows: PortfolioRow[] = [];

            // Add investment portfolios
            for (const portfolio of portfolios) {
                const performance = dashboardData.portfolios.find(p => p.portfolio_id === portfolio.portfolio_id);

                rows.push({
                    id: portfolio.portfolio_id,
                    name: portfolio.name,
                    idBadge: `#${portfolio.portfolio_id}`,
                    assetType: portfolio.asset_id === 'A001' ? 'STOCK' : portfolio.asset_id === 'A003' ? 'GOLD' : 'FOREX',
                    platform: portfolio.platform_id === 'P001' ? 'SSI' : portfolio.platform_id === 'P002' ? 'VCB' : 'MoMo',
                    strategy: portfolio.strategy_id === 'S001' ? 'Long Term' : portfolio.strategy_id === 'S002' ? 'Mid Term' : 'DCA',
                    balance: performance?.current_nav || 0,
                    profit: performance?.profit || 0,
                    profitPercentage: performance?.profit_percentage || 0,
                    xirr: performance?.xirr || null,
                });
            }

            // Add cash accounts
            for (const cashAccount of cashAccounts) {
                const balance = dashboardData.cash_accounts.find(c => c.cash_account_id === cashAccount.cash_account_id);

                rows.push({
                    id: cashAccount.cash_account_id,
                    name: cashAccount.name,
                    idBadge: `#${cashAccount.cash_account_id}`,
                    assetType: 'CASH',
                    platform: cashAccount.platform_id === 'P002' ? 'VCB' : cashAccount.platform_id === 'P003' ? 'MoMo' : 'SSI',
                    strategy: 'Holding',
                    balance: balance?.balance || 0,
                    profit: 0,
                    profitPercentage: 0,
                    xirr: null,
                });
            }

            setData({
                rows,
                totalNetWorth: dashboardData.total_net_worth,
                totalProfit: dashboardData.portfolios.reduce((sum, p) => sum + p.profit, 0),
                averageXIRR: dashboardData.portfolios.length > 0
                    ? dashboardData.portfolios.reduce((sum, p) => sum + p.xirr, 0) / dashboardData.portfolios.length
                    : 0,
            });
        } catch (error) {
            console.error('Failed to fetch portfolio data:', error);
        } finally {
            setLoading(false);
        }
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KPICard
                        title="Total Net Worth"
                        value={`$${data.totalNetWorth.toLocaleString()}`}
                        change={5.2}
                        icon={<TrendUpIcon />}
                        iconBg="bg-emerald-500/10"
                    />
                    <KPICard
                        title="Total Profit/Loss"
                        value={`$${data.totalProfit.toLocaleString()}`}
                        change={6.4}
                        icon={<TrendUpIcon />}
                        iconBg="bg-emerald-500/10"
                        valueColor={data.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                    />
                    <KPICard
                        title="Average XIRR"
                        value={`${data.averageXIRR.toFixed(2)}%`}
                        change={1.2}
                        changeLabel="Annualized"
                        icon={<PercentIcon />}
                        iconBg="bg-amber-500/10"
                        valueColor="text-amber-400"
                    />
                </div>

                {/* Portfolio Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <PortfolioTable data={data.rows} />
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

