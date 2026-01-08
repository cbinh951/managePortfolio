import { useState, useMemo } from 'react';
import { Snapshot, Transaction } from '@/types/models';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import MonthlyHeatmap from '@/components/portfolio/MonthlyHeatmap';
import RiskMetrics from '@/components/portfolio/RiskMetrics';
import { calculateMonthlyReturns, calculateRiskMetrics, formatXIRR } from '@/utils/performanceUtils';

interface PerformanceTabProps {
    xirr: number | null;
    totalReturn: number;
    snapshots?: Snapshot[];
    transactions?: Transaction[];
    loading?: boolean;
}

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

export default function PerformanceTab({ xirr, totalReturn, snapshots = [], transactions = [], loading = false }: PerformanceTabProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

    const sortedSnapshots = useMemo(() => {
        if (!snapshots || snapshots.length === 0) return [];
        return [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [snapshots]);

    // Calculate derived data
    const monthlyReturns = useMemo(() => calculateMonthlyReturns(snapshots), [snapshots]);
    const riskMetrics = useMemo(() => calculateRiskMetrics(snapshots), [snapshots]);

    // Filter data for chart based on time range
    const chartData = useMemo(() => {
        if (sortedSnapshots.length === 0) return [];

        const now = new Date();
        let startDate = new Date(sortedSnapshots[0].date); // Default to ALL

        switch (timeRange) {
            case '1M':
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3M':
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6M':
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1Y':
                startDate = new Date();
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
                break;
            case 'ALL':
            default:
                // Use first snapshot date
                startDate = new Date(sortedSnapshots[0].date);
                break;
        }

        const filtered = sortedSnapshots.filter(s => new Date(s.date) >= startDate);

        // Calculate cumulative withdrawn amount for each snapshot date
        const withdrawalMap = new Map<string, number>();
        let cumulativeWithdrawn = 0;

        // Build sorted withdrawal timeline
        transactions
            .filter(t => t.type === 'WITHDRAW')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach(t => {
                cumulativeWithdrawn += Math.abs(t.amount);
                withdrawalMap.set(t.date, cumulativeWithdrawn);
            });

        // Normalize for "Growth of" chart - percentage change relative to start of period
        if (filtered.length === 0) return [];

        // Calculate Total Equity for start to determine baseline
        const startDate_str = filtered[0].date;
        let startWithdrawn = 0;
        for (const [txDate, amount] of withdrawalMap.entries()) {
            if (new Date(txDate) <= new Date(startDate_str)) {
                startWithdrawn = amount;
            }
        }
        const baseEquity = filtered[0].nav + startWithdrawn;

        return filtered.map(s => {
            // Find cumulative withdrawn up to this snapshot date
            let withdrawn = 0;
            for (const [txDate, amount] of withdrawalMap.entries()) {
                if (new Date(txDate) <= new Date(s.date)) {
                    withdrawn = amount;
                }
            }

            const totalEquity = s.nav + withdrawn;
            const navPercentage = baseEquity > 0 ? ((s.nav - (filtered[0].nav + startWithdrawn)) / baseEquity) * 100 : 0;
            const withdrawnPercentage = baseEquity > 0 ? ((withdrawn - startWithdrawn) / baseEquity) * 100 : 0;

            return {
                date: s.date,
                displayDate: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
                nav: s.nav,
                withdrawn,
                totalEquity,
                value: navPercentage,
                withdrawnPercentage: withdrawnPercentage,
            };
        });
    }, [sortedSnapshots, timeRange, transactions]);

    // Current period return
    const periodReturn = useMemo(() => {
        if (chartData.length < 2) return 0;
        return chartData[chartData.length - 1].value;
    }, [chartData]);


    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (snapshots.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-800/50 rounded-xl border border-slate-700">
                <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Insufficient Data</h3>
                <p className="text-slate-500 max-w-md">
                    We need at least two snapshots to calculate performance metrics.
                    Please ensure you have added snapshot history to your portfolio.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Performance Analytics</h2>
            <p className="text-slate-400 -mt-4 mb-6">Detailed analysis of your portfolio&apos;s growth, risk metrics, and returns over time.</p>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Return */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 text-sm font-medium mb-1">Total Return</div>
                        <div className={`text-2xl font-bold mb-2 ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-400">Since inception</div>
                    </div>
                </div>

                {/* XIRR */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2zM5 22h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM19 8v2H5V8h14z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="text-slate-400 text-sm font-medium mb-1">XIRR (Annualized)</div>
                        <div className={`text-2xl font-bold mb-2 ${xirr !== null && xirr !== undefined && xirr >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                            {xirr !== null && xirr !== undefined ? `${xirr > 0 ? '+' : ''}${xirr.toFixed(2)}%` : '--'}
                        </div>
                        <div className="text-xs text-slate-400">Internal Rate of Return</div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-300 mb-1">
                            Total Equity Performance
                        </h4>
                        <p className="text-xs text-slate-400">
                            Performance is calculated based on total assets owned past and present (Current NAV + Withdrawn Funds).
                            <span className="font-semibold text-blue-300"> Withdrawals do not reduce your investment performance.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Total Equity Growth</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Combined value of holdings + withdrawals • Shows true performance over time
                        </p>
                        <p className="text-sm text-slate-400">
                            Current period return:
                            <span className={`ml-2 font-bold ${periodReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {periodReturn > 0 ? '+' : ''}{periodReturn.toFixed(2)}%
                            </span>
                        </p>
                    </div>
                    {/* Time Filters */}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                        {(['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="#64748b"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={{ stroke: '#475569' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `${value.toFixed(0)}%`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs">
                                                <p className="text-slate-400 text-xs mb-2">{data.displayDate}</p>
                                                <p className="text-white font-bold text-lg mb-1">
                                                    {Number(data.value).toFixed(2)}%
                                                </p>
                                                <div className="border-t border-slate-700 mt-2 pt-2 space-y-1">
                                                    <p className="text-slate-400 text-xs">
                                                        <span className="text-blue-400 font-semibold">
                                                            Total Equity:
                                                        </span>{' '}
                                                        {Number(data.totalEquity).toLocaleString()}
                                                    </p>
                                                    <p className="text-slate-400 text-xs">
                                                        • Current NAV: {Number(data.nav).toLocaleString()}
                                                    </p>
                                                    <p className="text-slate-400 text-xs">
                                                        • Withdrawn: {Number(data.withdrawn).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="border-t border-slate-700 mt-2 pt-2">
                                                    <p className="text-xs text-slate-500 italic">
                                                        Performance = NAV + Withdrawn
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />

                            {/* Stacked Areas: NAV + Withdrawn */}
                            <Area
                                type="monotone"
                                dataKey="value"
                                stackId="1"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#colorNav)"
                                name="NAV Growth"
                            />
                            <Area
                                type="monotone"
                                dataKey="withdrawnPercentage"
                                stackId="1"
                                stroke="#a855f7"
                                strokeWidth={2}
                                fill="url(#colorWithdrawn)"
                                name="Withdrawn"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-slate-400">NAV Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-slate-400">Withdrawn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 italic">Total = NAV + Withdrawn</span>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Heatmap + Risk Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 min-h-[400px]">
                    <MonthlyHeatmap monthlyReturns={monthlyReturns} />
                </div>
                <div className="min-h-[400px]">
                    <RiskMetrics metrics={riskMetrics} />
                </div>
            </div>
        </div>
    );
}
