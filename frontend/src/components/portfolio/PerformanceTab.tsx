import { useState, useMemo } from 'react';
import { Snapshot } from '@/types/models';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import MonthlyHeatmap from '@/components/portfolio/MonthlyHeatmap';
import RiskMetrics from '@/components/portfolio/RiskMetrics';
import { calculateMonthlyReturns, calculateRiskMetrics } from '@/utils/performanceUtils';

interface PerformanceTabProps {
    xirr: number | null;
    totalReturn: number;
    snapshots?: Snapshot[];
    loading?: boolean;
}

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

export default function PerformanceTab({ xirr, totalReturn, snapshots = [], loading = false }: PerformanceTabProps) {
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

        // Normalize for "Growth of" chart - percentage change relative to start of period
        if (filtered.length === 0) return [];

        const baseNav = filtered[0].nav;
        return filtered.map(s => ({
            date: s.date,
            displayDate: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
            nav: s.nav,
            value: baseNav > 0 ? ((s.nav - baseNav) / baseNav) * 100 : 0
        }));
    }, [sortedSnapshots, timeRange]);

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

            {/* Main Chart Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Portfolio Growth</h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Cumulative return from baseline • Shows total growth since {timeRange === 'ALL' ? 'inception' : 'period start'}
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
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                stroke="#94a3b8"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(val) => `${val.toFixed(0)}%`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                                <p className="text-slate-400 text-xs mb-1">{payload[0].payload.displayDate}</p>
                                                <p className="text-white font-bold text-lg">
                                                    {Number(payload[0].value).toFixed(2)}%
                                                </p>
                                                <p className="text-slate-400 text-xs">NAV: {Number(payload[0].payload.nav).toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
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
