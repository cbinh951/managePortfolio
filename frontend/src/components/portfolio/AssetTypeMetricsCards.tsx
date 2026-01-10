'use client';

import { AssetTypeMetrics } from '@/types/models';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

interface AssetTypeMetricsCardsProps {
    metrics: AssetTypeMetrics | null;
    loading: boolean;
}

export default function AssetTypeMetricsCards({ metrics, loading }: AssetTypeMetricsCardsProps) {
    const { settings } = useSettings();

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-slate-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                <p className="text-slate-400">No data available</p>
            </div>
        );
    }

    const profitIsPositive = metrics.total_profit_loss >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Net Worth */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-20 h-20 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                    </svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-400 text-sm font-medium">Total Net Worth</p>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(metrics.total_net_worth, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {metrics.asset_type === 'ALL' ? 'All Asset Types' : metrics.asset_type}
                    </p>
                </div>
            </div>

            {/* Total Profit/Loss */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-20 h-20 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <p className="text-slate-400 text-sm font-medium">Total Profit/Loss</p>
                    </div>
                    <h2 className={`text-3xl font-bold mb-1 ${profitIsPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profitIsPositive ? '+' : ''}{formatCurrency(metrics.total_profit_loss, 'VND', settings.displayCurrency, settings.exchangeRate)}
                    </h2>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${profitIsPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                        {profitIsPositive ? '+' : ''}{metrics.profit_loss_percentage.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Cash */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-20 h-20 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                        <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                    </svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-slate-400 text-sm font-medium">Cash</p>
                    </div>
                    <h2 className={`text-3xl font-bold mb-1 ${metrics.average_xirr >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {metrics.average_xirr >= 0 ? '+' : ''}{metrics.average_xirr.toFixed(2)}%
                    </h2>
                    <p className="text-xs text-slate-500">
                        Annualized Return
                    </p>
                </div>
            </div>
        </div>
    );
}
