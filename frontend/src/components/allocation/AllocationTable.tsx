import { AllocationItem } from './AllocationDonutChart';

interface AllocationTableProps {
    data: AllocationItem[];
}

export default function AllocationTable({ data }: AllocationTableProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Holdings Breakdown</h3>
                <div className="flex gap-2 text-slate-400">
                    <button className="p-1 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    </button>
                    <button className="p-1 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-left">
                            <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Class</th>
                            <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</th>
                            <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Allocation %</th>
                            <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target %</th>
                            <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">24h Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {data.map((item) => (
                            <tr key={item.name} className="group hover:bg-slate-700/20 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                            {/* Icon depending on asset type - simpler logic for now */}
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.name}</p>
                                            <p className="text-xs text-slate-500">Asset Class</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-sm font-medium text-slate-300">
                                    {item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 w-8">{item.percentage.toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-slate-400">
                                    {/* Mock Target for visual parity */}
                                    {(item.percentage * 0.9).toFixed(0)}%
                                </td>
                                <td className="py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                        +{(Math.random() * 2).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
