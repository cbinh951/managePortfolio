import { RiskMetrics } from '@/utils/performanceUtils';

interface ComparisonMatrixProps {
    items: {
        id: string;
        name: string;
        color: string;
        metrics: RiskMetrics;
        totalReturn: number;
    }[];
}

export default function ComparisonMatrix({ items }: ComparisonMatrixProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Detailed Matrix</h3>
                <button className="text-sm text-blue-400 hover:text-blue-300">View Full Table</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase pb-4 w-[200px]">Metric</th>
                            {items.map(item => (
                                <th key={item.id} className="text-right pb-4 px-4">
                                    <div className="flex flex-col items-end">
                                        <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs font-bold text-slate-300 uppercase">{item.name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {/* Total Return Row */}
                        <tr className="hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 text-sm font-medium text-slate-300">Total Return</td>
                            {items.map(item => (
                                <td key={item.id} className={`text-right py-4 px-4 text-sm font-bold ${item.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {item.totalReturn > 0 ? '+' : ''}{item.totalReturn.toFixed(2)}%
                                </td>
                            ))}
                        </tr>

                        {/* Volatility */}
                        <tr className="hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 text-sm font-medium text-slate-300">Annualized Volatility</td>
                            {items.map(item => (
                                <td key={item.id} className="text-right py-4 px-4 text-sm text-slate-300 font-mono">
                                    {item.metrics.standardDeviation.toFixed(1)}%
                                </td>
                            ))}
                        </tr>

                        {/* Sharpe Ratio */}
                        <tr className="hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 text-sm font-medium text-slate-300">Sharpe Ratio</td>
                            {items.map(item => (
                                <td key={item.id} className="text-right py-4 px-4 text-sm text-slate-300 font-mono">
                                    {item.metrics.sharpeRatio.toFixed(2)}
                                </td>
                            ))}
                        </tr>

                        {/* Max Drawdown */}
                        <tr className="hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 text-sm font-medium text-slate-300">Max Drawdown</td>
                            {items.map(item => (
                                <td key={item.id} className="text-right py-4 px-4 text-sm text-red-400 font-mono">
                                    {item.metrics.maxDrawdown.toFixed(1)}%
                                </td>
                            ))}
                        </tr>

                        {/* Win Rate */}
                        <tr className="hover:bg-slate-700/20 transition-colors">
                            <td className="py-4 text-sm font-medium text-slate-300">Win Rate</td>
                            {items.map(item => (
                                <td key={item.id} className={`text-right py-4 px-4 text-sm font-bold ${item.metrics.winRate > 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {item.metrics.winRate.toFixed(0)}%
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
