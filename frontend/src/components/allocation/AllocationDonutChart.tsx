import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface AllocationItem {
    name: string;
    value: number;
    color: string;
    percentage: number;
}

interface AllocationDonutChartProps {
    data: AllocationItem[];
}

export default function AllocationDonutChart({ data }: AllocationDonutChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-xl border border-slate-700">
                <span className="text-slate-500">No allocation data available</span>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Current Allocation</h3>
                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">Edit Strategy</button>
            </div>

            <div className="flex-1 min-h-[300px] relative">
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 text-sm">Total Assets</span>
                    <span className="text-3xl font-bold text-white">{data.length}</span>
                    <span className="text-slate-500 text-xs">Categories</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as AllocationItem;
                                    return (
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <p className="text-white font-medium">{item.name}</p>
                                            </div>
                                            <p className="text-xl font-bold text-white mb-0.5">
                                                {item.percentage.toFixed(1)}%
                                            </p>
                                            <p className="text-slate-400 text-xs">
                                                {item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <div>
                                <p className="text-sm font-medium text-slate-300">{item.name}</p>
                                <p className="text-xs text-slate-500">
                                    {item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-white">{item.percentage.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
