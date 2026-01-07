import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';
import { Snapshot, Transaction, AssetType, GoldType } from '@/types/models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OverviewTabProps {
    portfolioName: string;
    snapshots?: Snapshot[];
    transactions?: Transaction[];
    currentNAV?: number;
    assetType?: AssetType;
    loading?: boolean;
}

export default function OverviewTab({ portfolioName, snapshots = [], transactions = [], currentNAV, assetType, loading = false }: OverviewTabProps) {
    const { settings } = useSettings();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Calculate cumulative invested amount for each snapshot date
    const calculateInvestedAtDate = (date: string) => {
        return transactions
            .filter(t => new Date(t.date) <= new Date(date))
            .filter(t => t.type === 'DEPOSIT' || t.type === 'BUY' || t.type === 'TRANSFER')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

    // Calculate gold holdings at a specific date
    const calculateGoldHoldingsAtDate = (date: string) => {
        let branded = 0;
        let privateGold = 0;

        transactions
            .filter(t => new Date(t.date) <= new Date(date))
            .forEach(t => {
                if (!t.quantity_chi || !t.gold_type) return;
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
    };

    // Prepare chart data from snapshots
    const chartData = [...snapshots]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(snapshot => {
            let navValue = snapshot.nav; // Default for non-Gold portfolios

            if (assetType === AssetType.GOLD && (snapshot.branded_gold_price || snapshot.private_gold_price)) {
                // Calculate NAV from gold holdings × prices
                const { branded, privateGold } = calculateGoldHoldingsAtDate(snapshot.date);
                const brandedValue = branded * (snapshot.branded_gold_price || 0);
                const privateValue = privateGold * (snapshot.private_gold_price || 0);
                navValue = brandedValue + privateValue;
            }

            return {
                date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: snapshot.date,
                value: navValue,
                invested: calculateInvestedAtDate(snapshot.date),
            };
        });

    // Custom tooltip for the chart
    interface TooltipPayload {
        dataKey: string;
        value: number;
        payload: {
            date: string;
            fullDate: string;
            value: number;
            invested: number;
        };
    }

    interface CustomTooltipProps {
        active?: boolean;
        payload?: TooltipPayload[];
    }

    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const nav = payload.find((p) => p.dataKey === 'value')?.value || 0;
            const invested = payload.find((p) => p.dataKey === 'invested')?.value || 0;
            const profit = nav - invested;
            const profitPercent = invested > 0 ? ((profit / invested) * 100) : 0;

            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="text-xs text-slate-400 mb-2">{payload[0].payload.date}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-blue-400">NAV:</span>
                            <span className="text-sm font-semibold text-white">
                                {formatCurrency(nav, 'VND', settings.displayCurrency, settings.exchangeRate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-amber-400">Invested:</span>
                            <span className="text-sm font-semibold text-white">
                                {formatCurrency(invested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
                            <span className="text-xs text-slate-400">Profit:</span>
                            <span className={`text-sm font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}{formatCurrency(profit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                <span className="text-xs ml-1">({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)</span>
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

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

                {/* Chart */}
                {chartData.length > 0 ? (
                    <div className="h-80">
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
                                    tickFormatter={(value) => formatCurrency(value, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px' }}
                                    iconType="line"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Portfolio Value"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="invested"
                                    name="Total Invested"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: '#f59e0b', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-80 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm text-slate-500">No snapshot data available</p>
                            <p className="text-xs text-slate-600 mt-1">Add snapshots to see portfolio value chart</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid Layout for Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        {(() => {
                            // Calculate stats from snapshots
                            const sortedSnapshots = [...snapshots].sort((a, b) =>
                                new Date(a.date).getTime() - new Date(b.date).getTime()
                            );

                            let bestDay = 0;
                            let worstDay = 0;
                            let totalReturn = 0;
                            let daysHeld = 0;

                            if (sortedSnapshots.length > 1) {
                                // Calculate day-to-day changes
                                const changes = [];
                                for (let i = 1; i < sortedSnapshots.length; i++) {
                                    const change = sortedSnapshots[i].nav - sortedSnapshots[i - 1].nav;
                                    changes.push(change);
                                }

                                bestDay = Math.max(...changes, 0);
                                worstDay = Math.min(...changes, 0);

                                // Calculate average return percentage
                                const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
                                const avgNav = sortedSnapshots.reduce((sum, s) => sum + s.nav, 0) / sortedSnapshots.length;
                                totalReturn = avgNav > 0 ? (avgChange / avgNav) * 100 : 0;

                                // Calculate days held
                                const firstDate = new Date(sortedSnapshots[0].date);
                                const lastDate = new Date(sortedSnapshots[sortedSnapshots.length - 1].date);
                                daysHeld = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
                            }

                            return (
                                <>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                                        <span className="text-sm text-slate-400">Best Day</span>
                                        <span className="text-sm font-semibold text-emerald-400">
                                            {bestDay > 0 ? '+' : ''}{formatCurrency(bestDay, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                                        <span className="text-sm text-slate-400">Worst Day</span>
                                        <span className="text-sm font-semibold text-red-400">
                                            {formatCurrency(worstDay, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                                        <span className="text-sm text-slate-400">Avg. Daily Return</span>
                                        <span className={`text-sm font-semibold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Days Held</span>
                                        <span className="text-sm font-semibold text-slate-300">{daysHeld}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Asset Allocation */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Value Breakdown</h3>
                    {(() => {
                        if (snapshots.length === 0) {
                            return (
                                <div className="h-48 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700/50">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                        </svg>
                                        <p className="text-xs text-slate-600">No data available</p>
                                    </div>
                                </div>
                            );
                        }

                        const latestSnapshot = [...snapshots].sort((a, b) =>
                            new Date(b.date).getTime() - new Date(a.date).getTime()
                        )[0];

                        const totalInvested = calculateInvestedAtDate(latestSnapshot.date);
                        // Use currentNAV prop if available (from performance API), otherwise fall back to snapshot NAV
                        const currentValue = currentNAV !== undefined ? currentNAV : latestSnapshot.nav;
                        const profit = currentValue - totalInvested;

                        // Handle edge cases for percentage calculations
                        let profitPercent: number | null = null;
                        let investedPercent = 0;
                        let profitPercentOfTotal = 0;

                        if (totalInvested > 0) {
                            // Normal case: has investments
                            profitPercent = (profit / totalInvested) * 100;
                            investedPercent = (totalInvested / currentValue) * 100;
                            profitPercentOfTotal = (profit / currentValue) * 100;
                        } else if (currentValue > 0) {
                            // Edge case: no investments but has value (e.g., Gold portfolio with only holdings)
                            profitPercent = null; // Will display as "N/A"
                            investedPercent = 0;
                            profitPercentOfTotal = 100;
                        }

                        return (
                            <div className="space-y-4">
                                {/* Visual Bar */}
                                <div className="h-8 bg-slate-900/50 rounded-lg overflow-hidden flex">
                                    {investedPercent > 0 && (
                                        <div
                                            className="bg-amber-500 flex items-center justify-center text-xs font-semibold text-white"
                                            style={{ width: `${Math.max(investedPercent, 5)}%` }}
                                            title={`Invested: ${investedPercent.toFixed(1)}%`}
                                        >
                                            {investedPercent > 15 && `${investedPercent.toFixed(0)}%`}
                                        </div>
                                    )}
                                    {profit > 0 && profitPercentOfTotal > 0 && (
                                        <div
                                            className="bg-emerald-500 flex items-center justify-center text-xs font-semibold text-white"
                                            style={{ width: `${Math.max(profitPercentOfTotal, 5)}%` }}
                                            title={`Profit: ${profitPercentOfTotal.toFixed(1)}%`}
                                        >
                                            {profitPercentOfTotal > 15 && `${profitPercentOfTotal.toFixed(0)}%`}
                                        </div>
                                    )}
                                    {profit < 0 && (
                                        <div
                                            className="bg-red-500 flex items-center justify-center text-xs font-semibold text-white"
                                            style={{ width: `${Math.max(Math.abs(profitPercentOfTotal), 5)}%` }}
                                            title={`Loss: ${Math.abs(profitPercentOfTotal).toFixed(1)}%`}
                                        >
                                            {Math.abs(profitPercentOfTotal) > 15 && `${Math.abs(profitPercentOfTotal).toFixed(0)}%`}
                                        </div>
                                    )}
                                </div>

                                {/* Legend */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-amber-500 rounded"></div>
                                            <span className="text-sm text-slate-400">Total Invested</span>
                                        </div>
                                        <span className="text-sm font-semibold text-white">
                                            {formatCurrency(totalInvested, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded ${profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            <span className="text-sm text-slate-400">{profit >= 0 ? 'Profit' : 'Loss'}</span>
                                        </div>
                                        <span className={`text-sm font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {profit >= 0 ? '+' : ''}{formatCurrency(profit, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                            <span className="text-xs ml-1">
                                                ({profitPercent !== null ? `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%` : 'N/A'})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                        <span className="text-sm font-medium text-slate-300">Current Value</span>
                                        <span className="text-sm font-bold text-white">
                                            {formatCurrency(currentValue, 'VND', settings.displayCurrency, settings.exchangeRate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
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
                </div>
            </div>
        </div>
    );
}
