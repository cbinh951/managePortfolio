interface OverviewTabProps {
    portfolioName: string;
    loading?: boolean;
}

export default function OverviewTab({ portfolioName, loading = false }: OverviewTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Portfolio Value Chart */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Portfolio Value</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                            1Y
                        </button>
                        <button className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                            YTD
                        </button>
                        <button className="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded">
                            ALL
                        </button>
                    </div>
                </div>

                {/* Placeholder Chart */}
                <div className="h-80 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm text-slate-500">Portfolio Value Chart</p>
                        <p className="text-xs text-slate-600 mt-1">Chart visualization coming soon</p>
                    </div>
                </div>
            </div>

            {/* Grid Layout for Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <span className="text-sm text-slate-400">Best Day</span>
                            <span className="text-sm font-semibold text-emerald-400">+$2,450.00</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <span className="text-sm text-slate-400">Worst Day</span>
                            <span className="text-sm font-semibold text-red-400">-$1,890.00</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <span className="text-sm text-slate-400">Avg. Daily Return</span>
                            <span className="text-sm font-semibold text-slate-300">+0.12%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Days Held</span>
                            <span className="text-sm font-semibold text-slate-300">365</span>
                        </div>
                    </div>
                </div>

                {/* Asset Allocation Placeholder */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
                    <div className="h-48 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="text-center">
                            <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                            <p className="text-xs text-slate-600">Allocation Chart</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Portfolio Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Portfolio Name</span>
                        <p className="text-sm text-white font-medium mt-1">{portfolioName}</p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Created Date</span>
                        <p className="text-sm text-white font-medium mt-1">Jan 1, 2024</p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Status</span>
                        <p className="text-sm mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Active
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
