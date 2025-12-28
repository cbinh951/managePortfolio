import { MonthlyReturn } from '@/utils/performanceUtils';

interface MonthlyHeatmapProps {
    monthlyReturns: MonthlyReturn[];
}

export default function MonthlyHeatmap({ monthlyReturns }: MonthlyHeatmapProps) {
    // Get unique years involved
    const years = Array.from(new Set(monthlyReturns.map(r => r.year))).sort((a, b) => b - a);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // If no data, show placeholder
    if (years.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Returns</h3>
                <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                    No return data available for heatmap
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Monthly Returns</h3>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-semibold text-slate-400 pb-4">Year</th>
                            {months.map(m => (
                                <th key={m} className="text-center text-xs font-semibold text-slate-400 pb-4 w-[7%]">
                                    {m}
                                </th>
                            ))}
                            <th className="text-right text-xs font-semibold text-slate-400 pb-4 pl-4">YTD</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {years.map(year => {
                            // Calculate YTD for this row
                            const yearReturns = monthlyReturns.filter(r => r.year === year);
                            const ytdValue = yearReturns.reduce((acc, curr) => {
                                return acc * (1 + curr.value / 100);
                            }, 1);
                            const ytdPercentage = (ytdValue - 1) * 100;

                            return (
                                <tr key={year} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="py-3 text-sm font-medium text-slate-300">{year}</td>
                                    {months.map((_, index) => {
                                        const ret = monthlyReturns.find(r => r.year === year && r.month === index);

                                        let bgClass = '';
                                        let textClass = 'text-slate-500';

                                        if (ret) {
                                            if (ret.value > 0) {
                                                textClass = 'text-emerald-400';
                                                // Opacity based on magnitude up to 10%
                                                const intensity = Math.min(Math.abs(ret.value) / 10, 1);
                                                // We can't easily do dynamic classes with arbitrary values in tailwind without inline styles
                                                // So we'll use inline styles for the background opacity
                                                bgClass = `rgba(16, 185, 129, ${intensity * 0.2})`;
                                            } else if (ret.value < 0) {
                                                textClass = 'text-red-400';
                                                const intensity = Math.min(Math.abs(ret.value) / 10, 1);
                                                bgClass = `rgba(248, 113, 113, ${intensity * 0.2})`;
                                            } else {
                                                textClass = 'text-slate-400';
                                            }
                                        }

                                        return (
                                            <td key={index} className="p-1">
                                                <div
                                                    className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${textClass}`}
                                                    style={{ backgroundColor: bgClass }}
                                                >
                                                    {ret ? `${ret.value >= 0 ? '+' : ''}${ret.value.toFixed(1)}%` : '-'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className={`text-right py-3 pl-4 text-sm font-bold ${ytdPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {ytdPercentage >= 0 ? '+' : ''}{ytdPercentage.toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-end gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500/20"></div>
                    <span className="text-slate-400">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/20"></div>
                    <span className="text-slate-400">Negative</span>
                </div>
            </div>
        </div>
    );
}
