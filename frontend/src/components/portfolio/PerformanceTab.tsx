import { Snapshot } from '@/types/models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';


interface PerformanceTabProps {
    xirr: number | null;
    totalReturn: number;
    snapshots?: Snapshot[];
    loading?: boolean;
}

export default function PerformanceTab({ xirr, totalReturn, snapshots = [], loading = false }: PerformanceTabProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Calculate time period returns
    const calculatePeriodReturn = (months: number) => {
        if (snapshots.length < 2) return null;

        const sortedSnapshots = [...snapshots].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestSnapshot = sortedSnapshots[0];
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - months);

        // Find closest snapshot to target date
        const periodSnapshot = sortedSnapshots.reduce((closest, snapshot) => {
            const snapshotDate = new Date(snapshot.date);
            const closestDate = new Date(closest.date);
            return Math.abs(snapshotDate.getTime() - targetDate.getTime()) <
                Math.abs(closestDate.getTime() - targetDate.getTime()) ? snapshot : closest;
        });

        if (periodSnapshot.nav === 0) return null;
        return ((latestSnapshot.nav - periodSnapshot.nav) / periodSnapshot.nav) * 100;
    };

    // Calculate max drawdown
    const calculateMaxDrawdown = () => {
        if (snapshots.length < 2) return null;

        const sortedSnapshots = [...snapshots].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let maxDrawdown = 0;
        let peak = sortedSnapshots[0].nav;

        for (const snapshot of sortedSnapshots) {
            if (snapshot.nav > peak) {
                peak = snapshot.nav;
            }
            const drawdown = ((snapshot.nav - peak) / peak) * 100;
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;
    };

    // Calculate win rate (percentage of positive changes)
    const calculateWinRate = () => {
        if (snapshots.length < 2) return null;

        const sortedSnapshots = [...snapshots].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let positiveChanges = 0;
        for (let i = 1; i < sortedSnapshots.length; i++) {
            if (sortedSnapshots[i].nav > sortedSnapshots[i - 1].nav) {
                positiveChanges++;
            }
        }

        return (positiveChanges / (sortedSnapshots.length - 1)) * 100;
    };

    const oneMonthReturn = calculatePeriodReturn(1);
    const threeMonthReturn = calculatePeriodReturn(3);
    const sixMonthReturn = calculatePeriodReturn(6);
    const oneYearReturn = calculatePeriodReturn(12);
    const maxDrawdown = calculateMaxDrawdown();
    const winRate = calculateWinRate();

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
                        { label: '1M', value: oneMonthReturn },
                        { label: '3M', value: threeMonthReturn },
                        { label: '6M', value: sixMonthReturn },
                        { label: '1Y', value: oneYearReturn },
                        { label: 'ALL', value: totalReturn },
                    ].map((period) => (
                        <div key={period.label} className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-2">{period.label}</div>
                            <div className={`text-lg font-bold ${period.value === null ? 'text-slate-500' :
                                period.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {period.value === null ? 'N/A' :
                                    `${period.value >= 0 ? '+' : ''}${period.value.toFixed(1)}%`}
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
                        {maxDrawdown !== null && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-slate-400">Max Drawdown</span>
                                    <p className="text-xs text-slate-500 mt-0.5">Largest peak-to-trough decline</p>
                                </div>
                                <span className="text-lg font-bold text-red-400">{maxDrawdown.toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Risk Metrics */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Portfolio Statistics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                            <div>
                                <span className="text-sm text-slate-400">Total Snapshots</span>
                                <p className="text-xs text-slate-500 mt-0.5">Number of data points</p>
                            </div>
                            <span className="text-lg font-bold text-slate-300">{snapshots.length}</span>
                        </div>
                        {winRate !== null && (
                            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                                <div>
                                    <span className="text-sm text-slate-400">Win Rate</span>
                                    <p className="text-xs text-slate-500 mt-0.5">Percentage of positive periods</p>
                                </div>
                                <span className="text-lg font-bold text-emerald-400">{winRate.toFixed(1)}%</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm text-slate-400">Tracking Period</span>
                                <p className="text-xs text-slate-500 mt-0.5">Days of data</p>
                            </div>
                            <span className="text-lg font-bold text-slate-300">
                                {snapshots.length >= 2 ? (() => {
                                    const sorted = [...snapshots].sort((a, b) =>
                                        new Date(a.date).getTime() - new Date(b.date).getTime()
                                    );
                                    const days = Math.floor(
                                        (new Date(sorted[sorted.length - 1].date).getTime() -
                                            new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)
                                    );
                                    return days;
                                })() : 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cumulative Return</h3>
                {snapshots.length >= 2 ? (() => {
                    const sortedSnapshots = [...snapshots].sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    );

                    const initialValue = sortedSnapshots[0].nav;
                    const chartData = sortedSnapshots.map(snapshot => ({
                        date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        return: initialValue > 0 ? ((snapshot.nav - initialValue) / initialValue) * 100 : 0,
                    }));

                    return (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const returnValue = payload[0].value;
                                                return (
                                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                                                        <p className="text-xs text-slate-400 mb-1">{payload[0].payload.date}</p>
                                                        <p className={`text-sm font-semibold ${returnValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {returnValue >= 0 ? '+' : ''}{returnValue.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="return"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    {/* Zero line */}
                                    <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    );
                })() : (
                    <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <p className="text-sm text-slate-500">No snapshot data available</p>
                            <p className="text-xs text-slate-600 mt-1">Add snapshots to see cumulative return chart</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
