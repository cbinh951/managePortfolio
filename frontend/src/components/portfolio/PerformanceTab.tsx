interface PerformanceTabProps {
    xirr: number | null;
    totalReturn: number;
    loading?: boolean;
}

export default function PerformanceTab({ xirr, totalReturn, loading = false }: PerformanceTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Time Period Returns */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Time Period Returns</h3>
                    <div className="text-xs text-slate-500">As of today</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: '1M', value: '+2.4%', trend: 'up' },
                        { label: '3M', value: '+7.8%', trend: 'up' },
                        { label: '6M', value: '+15.2%', trend: 'up' },
                        { label: '1Y', value: '+28.5%', trend: 'up' },
                        { label: 'ALL', value: `+${totalReturn.toFixed(1)}%`, trend: 'up' },
                    ].map((period) => (
                        <div key={period.label} className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-2">{period.label}</div>
                            <div className={`text-lg font-bold ${period.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {period.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Metrics */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Key Performance Metrics</h3>
                    <div className="space-y-4">
                        {xirr !== null && (
                            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                                <div>
                                    <span className="text-sm text-slate-400">XIRR (Annualized)</span>
                                    <p className="text-xs text-slate-500 mt-0.5">Internal Rate of Return</p>
                                </div>
                                <span className={`text-lg font-bold ${xirr >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {xirr >= 0 ? '+' : ''}{xirr.toFixed(2)}%
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Total Return</span>
                                <p className="text-xs text-slate-500 mt-0.5">Cumulative percentage gain</p>
                            </div>
                            <span className={`text-lg font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Sharpe Ratio</span>
                                <p className="text-xs text-slate-500 mt-0.5">Risk-adjusted return</p>
                            </div>
                            <span className="text-lg font-bold text-slate-300">1.85</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm text-slate-400">Max Drawdown</span>
                                <p className="text-xs text-slate-500 mt-0.5">Largest peak-to-trough decline</p>
                            </div>
                            <span className="text-lg font-bold text-red-400">-12.5%</span>
                        </div>
                    </div>
                </div>

                {/* Risk Metrics */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Volatility</span>
                                <p className="text-xs text-slate-500 mt-0.5">Standard deviation</p>
                            </div>
                            <span className="text-lg font-bold text-slate-300">18.2%</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Beta</span>
                                <p className="text-xs text-slate-500 mt-0.5">Market correlation</p>
                            </div>
                            <span className="text-lg font-bold text-slate-300">0.92</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Value at Risk (95%)</span>
                                <p className="text-xs text-slate-500 mt-0.5">1-day VaR</p>
                            </div>
                            <span className="text-lg font-bold text-red-400">-$2,450</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm text-slate-400">Win Rate</span>
                                <p className="text-xs text-slate-500 mt-0.5">Percentage of positive days</p>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">64.5%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Comparison</h3>
                <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p className="text-sm text-slate-500">Performance Comparison Chart</p>
                        <p className="text-xs text-slate-600 mt-1">Compare against benchmark indices</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
